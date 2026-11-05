import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import {
  AdminLeader,
  BannerItem,
  FacilityItem,
  GoverningMember,
  SiteContentBlock,
  SiteSetting,
} from '../../types/school';
import {
  deleteBannerItem,
  fetchAdministrationForAdmin,
  fetchBannersForAdmin,
  fetchFacilitiesForAdmin,
  fetchGoverningBodyForAdmin,
  fetchSiteContentBlocksForAdmin,
  fetchSiteSettingsForAdmin,
  saveAdminLeader,
  saveBannerItem,
  saveFacilityItem,
  saveGoverningMember,
  saveSiteContentBlock,
  saveSiteSettings,
} from '../../services/adminService';

type ContentTab =
  | 'welcome'
  | 'banners'
  | 'administration'
  | 'governing'
  | 'facilities'
  | 'contact';

export const AdminWebsiteContentPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const { refreshData } = usePublicData();
  const actorRole = adminProfile?.role || 'content_editor';

  const [activeTab, setActiveTab] = useState<ContentTab>('welcome');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [contentBlocks, setContentBlocks] = useState<SiteContentBlock[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [leaders, setLeaders] = useState<AdminLeader[]>([]);
  const [govMembers, setGovMembers] = useState<GoverningMember[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sc, bn, adm, gov, fac, st] = await Promise.all([
        fetchSiteContentBlocksForAdmin(),
        fetchBannersForAdmin(),
        fetchAdministrationForAdmin(),
        fetchGoverningBodyForAdmin(),
        fetchFacilitiesForAdmin(),
        fetchSiteSettingsForAdmin(),
      ]);
      setContentBlocks(sc.items);
      setBanners(bn.items);
      setLeaders(adm.items);
      setGovMembers(gov.items);
      setFacilities(fac.items);
      setSiteSetting(st);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Failed to load website content.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const notifySaved = async (msg: string) => {
    setFeedback({ type: 'success', msg });
    await refreshData();
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveBlock = async (block: SiteContentBlock) => {
    setSaving(true);
    setFeedback(null);
    try {
      await saveSiteContentBlock(block, actorRole);
      await notifySaved(`Saved "${block.sectionKey}" content block.`);
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBanner = async (banner: BannerItem) => {
    setSaving(true);
    setFeedback(null);
    try {
      const id = await saveBannerItem(banner, actorRole);
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...banner, id } : b)));
      await notifySaved(`Saved hero banner "${banner.titleEn}".`);
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setSaving(true);
    try {
      await deleteBannerItem(id, actorRole);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      await notifySaved('Removed hero banner.');
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Delete failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLeader = async (leader: AdminLeader) => {
    setSaving(true);
    setFeedback(null);
    try {
      const id = await saveAdminLeader(leader, actorRole);
      setLeaders((prev) => prev.map((l) => (l.id === leader.id ? { ...leader, id } : l)));
      await notifySaved(`Updated "${leader.name}" profile & message.`);
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGovMember = async (member: GoverningMember) => {
    setSaving(true);
    setFeedback(null);
    try {
      const id = await saveGoverningMember(member, actorRole);
      setGovMembers((prev) => prev.map((m) => (m.id === member.id ? { ...member, id } : m)));
      await notifySaved(`Saved Governing Body member "${member.name}".`);
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFacility = async (fac: FacilityItem) => {
    setSaving(true);
    setFeedback(null);
    try {
      const id = await saveFacilityItem(fac, actorRole);
      setFacilities((prev) => prev.map((f) => (f.id === fac.id ? { ...fac, id } : f)));
      await notifySaved(`Saved facility "${fac.titleEn}".`);
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContactFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSetting) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveSiteSettings(siteSetting, actorRole);
      await notifySaved('Updated school highlights, contact details, footer & social links.');
    } catch (err) {
      setFeedback({ type: 'error', msg: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: ContentTab; label: string }[] = [
    { key: 'welcome', label: 'Welcome & About' },
    { key: 'banners', label: 'Hero Banners' },
    { key: 'administration', label: 'Administration & Principal' },
    { key: 'governing', label: 'Governing Body' },
    { key: 'facilities', label: 'Facilities' },
    { key: 'contact', label: 'Highlights, Contact & Footer' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
            Public Website Content Management
          </h2>
          <p className="text-xs text-[#617187] mt-0.5">
            Changes saved here publish directly to Firestore and update the public website live.
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white rounded-xl border border-slate-200 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-[#102B50] text-white'
                : 'text-[#17263C] hover:bg-[#F6F8FC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 py-14 flex items-center justify-center gap-2 text-xs text-[#617187]">
          <Loader2 className="w-5 h-5 animate-spin text-[#1F5FAF]" />
          <span>Loading website content...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: WELCOME & ABOUT BLOCKS */}
          {activeTab === 'welcome' && (
            <div className="space-y-4">
              {contentBlocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold text-[#1F5FAF] uppercase">
                        Section Key: {block.sectionKey}
                      </span>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                      <input
                        type="checkbox"
                        checked={block.isPublished}
                        onChange={(e) =>
                          setContentBlocks((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, isPublished: e.target.checked } : b
                            )
                          )
                        }
                      />
                      <span>Published on Public Site</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Heading (English)
                      </label>
                      <input
                        type="text"
                        value={block.titleEn}
                        onChange={(e) =>
                          setContentBlocks((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, titleEn: e.target.value } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Heading (Bengali)
                      </label>
                      <input
                        type="text"
                        value={block.titleBn}
                        onChange={(e) =>
                          setContentBlocks((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, titleBn: e.target.value } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Body Text (English)
                      </label>
                      <textarea
                        rows={4}
                        value={block.bodyEn}
                        onChange={(e) =>
                          setContentBlocks((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, bodyEn: e.target.value } : b))
                          )
                        }
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Body Text (Bengali)
                      </label>
                      <textarea
                        rows={4}
                        value={block.bodyBn}
                        onChange={(e) =>
                          setContentBlocks((prev) =>
                            prev.map((b, i) => (i === idx ? { ...b, bodyBn: e.target.value } : b))
                          )
                        }
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveBlock(block)}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Section</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: HERO BANNERS */}
          {activeTab === 'banners' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setBanners((prev) => [
                      ...prev,
                      {
                        id: `bnr_${Date.now()}`,
                        titleEn: 'BEPZA Public School & College, Ishwardi EPZ',
                        titleBn: 'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড',
                        subtitleEn: 'Excellence in academic discipline and modern education.',
                        subtitleBn: 'মানসম্মত শিক্ষা ও নৈতিক চরিত্র গঠনে অঙ্গীকারবদ্ধ।',
                        imageUrl: '/assets/campus/campus-main.jpg',
                        order: prev.length + 1,
                        isPublished: true,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Hero Banner</span>
                </button>
              </div>

              {banners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#102B50]">
                      Slide #{banner.order} ({banner.id})
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102B50]">
                        <input
                          type="checkbox"
                          checked={banner.isPublished}
                          onChange={(e) =>
                            setBanners((prev) =>
                              prev.map((b, i) =>
                                i === idx ? { ...b, isPublished: e.target.checked } : b
                              )
                            )
                          }
                        />
                        <span>Published</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => void handleDeleteBanner(banner.id)}
                        className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Title (English)
                      </label>
                      <input
                        type="text"
                        value={banner.titleEn}
                        onChange={(e) =>
                          setBanners((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, titleEn: e.target.value } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Title (Bengali)
                      </label>
                      <input
                        type="text"
                        value={banner.titleBn}
                        onChange={(e) =>
                          setBanners((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, titleBn: e.target.value } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Subtitle (English)
                      </label>
                      <input
                        type="text"
                        value={banner.subtitleEn}
                        onChange={(e) =>
                          setBanners((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, subtitleEn: e.target.value } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Subtitle (Bengali)
                      </label>
                      <input
                        type="text"
                        value={banner.subtitleBn}
                        onChange={(e) =>
                          setBanners((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, subtitleBn: e.target.value } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Banner Image URL
                      </label>
                      <input
                        type="text"
                        value={banner.imageUrl}
                        onChange={(e) =>
                          setBanners((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, imageUrl: e.target.value } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={banner.order}
                        onChange={(e) =>
                          setBanners((prev) =>
                            prev.map((b, i) =>
                              i === idx ? { ...b, order: Number(e.target.value) || 1 } : b
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveBanner(banner)}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Banner</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ADMINISTRATION & PRINCIPAL */}
          {activeTab === 'administration' && (
            <div className="space-y-4">
              {leaders.map((leader, idx) => (
                <div
                  key={leader.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-[#1F5FAF] uppercase">
                      {leader.roleKey.replace(/_/g, ' ')}
                    </span>
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102B50]">
                      <input
                        type="checkbox"
                        checked={leader.isPublished}
                        onChange={(e) =>
                          setLeaders((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, isPublished: e.target.checked } : l
                            )
                          )
                        }
                      />
                      <span>Published</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Full Name (English)
                      </label>
                      <input
                        type="text"
                        value={leader.name}
                        onChange={(e) =>
                          setLeaders((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, name: e.target.value } : l))
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Full Name (Bengali)
                      </label>
                      <input
                        type="text"
                        value={leader.nameBn}
                        onChange={(e) =>
                          setLeaders((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, nameBn: e.target.value } : l))
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Designation (English)
                      </label>
                      <input
                        type="text"
                        value={leader.designationEn}
                        onChange={(e) =>
                          setLeaders((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, designationEn: e.target.value } : l
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Photograph URL
                      </label>
                      <input
                        type="text"
                        value={leader.photoUrl}
                        onChange={(e) =>
                          setLeaders((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, photoUrl: e.target.value } : l
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Official Message (English)
                      </label>
                      <textarea
                        rows={4}
                        value={leader.messageEn}
                        onChange={(e) =>
                          setLeaders((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, messageEn: e.target.value } : l
                            )
                          )
                        }
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Official Message (Bengali)
                      </label>
                      <textarea
                        rows={4}
                        value={leader.messageBn}
                        onChange={(e) =>
                          setLeaders((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, messageBn: e.target.value } : l
                            )
                          )
                        }
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveLeader(leader)}
                      className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Leader Profile</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: GOVERNING BODY */}
          {activeTab === 'governing' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setGovMembers((prev) => [
                      ...prev,
                      {
                        id: `gov_${Date.now()}`,
                        name: 'New Governing Member',
                        nameBn: 'নতুন গভর্নিং সদস্য',
                        boardRoleEn: 'Member',
                        boardRoleBn: 'সদস্য',
                        designationEn: 'Ishwardi EPZ',
                        designationBn: 'ঈশ্বরদী ইপিজেড',
                        photoUrl: '',
                        order: prev.length + 1,
                        isPublished: true,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Governing Body Member</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {govMembers.map((member, idx) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#102B50] mb-1">
                          Name (EN)
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) =>
                            setGovMembers((prev) =>
                              prev.map((m, i) =>
                                i === idx ? { ...m, name: e.target.value } : m
                              )
                            )
                          }
                          className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#102B50] mb-1">
                          Board Role (EN)
                        </label>
                        <input
                          type="text"
                          value={member.boardRoleEn}
                          onChange={(e) =>
                            setGovMembers((prev) =>
                              prev.map((m, i) =>
                                i === idx ? { ...m, boardRoleEn: e.target.value } : m
                              )
                            )
                          }
                          className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#102B50] mb-1">
                          Designation (EN)
                        </label>
                        <input
                          type="text"
                          value={member.designationEn}
                          onChange={(e) =>
                            setGovMembers((prev) =>
                              prev.map((m, i) =>
                                i === idx ? { ...m, designationEn: e.target.value } : m
                              )
                            )
                          }
                          className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <label className="inline-flex items-center gap-1.5 text-xs text-[#102B50]">
                        <input
                          type="checkbox"
                          checked={member.isPublished}
                          onChange={(e) =>
                            setGovMembers((prev) =>
                              prev.map((m, i) =>
                                i === idx ? { ...m, isPublished: e.target.checked } : m
                              )
                            )
                          }
                        />
                        <span>Published</span>
                      </label>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void handleSaveGovMember(member)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#102B50] text-white text-xs font-semibold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FACILITIES */}
          {activeTab === 'facilities' && (
            <div className="space-y-4">
              {facilities.map((fac, idx) => (
                <div
                  key={fac.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Facility Title (English)
                      </label>
                      <input
                        type="text"
                        value={fac.titleEn}
                        onChange={(e) =>
                          setFacilities((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, titleEn: e.target.value } : f
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Facility Title (Bengali)
                      </label>
                      <input
                        type="text"
                        value={fac.titleBn}
                        onChange={(e) =>
                          setFacilities((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, titleBn: e.target.value } : f
                            )
                          )
                        }
                        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[#102B50] mb-1">
                        Description (English)
                      </label>
                      <textarea
                        rows={2}
                        value={fac.descriptionEn}
                        onChange={(e) =>
                          setFacilities((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, descriptionEn: e.target.value } : f
                            )
                          )
                        }
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102B50]">
                      <input
                        type="checkbox"
                        checked={fac.isPublished}
                        onChange={(e) =>
                          setFacilities((prev) =>
                            prev.map((f, i) =>
                              i === idx ? { ...f, isPublished: e.target.checked } : f
                            )
                          )
                        }
                      />
                      <span>Published</span>
                    </label>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveFacility(fac)}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-1.5 rounded-lg bg-[#102B50] text-white text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Facility</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: HIGHLIGHTS, CONTACT, FOOTER & SOCIAL */}
          {activeTab === 'contact' && siteSetting && (
            <form
              onSubmit={handleSaveContactFooter}
              className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    School Name (English)
                  </label>
                  <input
                    type="text"
                    value={siteSetting.schoolNameEn}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, schoolNameEn: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    School Name (Bengali)
                  </label>
                  <input
                    type="text"
                    value={siteSetting.schoolNameBn}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, schoolNameBn: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Total Students Highlight Label
                  </label>
                  <input
                    type="text"
                    value={siteSetting.totalStudents}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, totalStudents: e.target.value })
                    }
                    placeholder="e.g., 850+"
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Primary Phone
                  </label>
                  <input
                    type="text"
                    value={siteSetting.phonePrimary}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, phonePrimary: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Primary Official Email
                  </label>
                  <input
                    type="email"
                    value={siteSetting.emailPrimary}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, emailPrimary: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={siteSetting.facebookUrl}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, facebookUrl: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Campus Address (English)
                  </label>
                  <input
                    type="text"
                    value={siteSetting.addressEn}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, addressEn: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Campus Address (Bengali)
                  </label>
                  <input
                    type="text"
                    value={siteSetting.addressBn}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, addressBn: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Footer Description Tagline (English)
                  </label>
                  <input
                    type="text"
                    value={siteSetting.footerTaglineEn || ''}
                    onChange={(e) =>
                      setSiteSetting({ ...siteSetting, footerTaglineEn: e.target.value })
                    }
                    placeholder="Operated under Bangladesh Export Processing Zones Authority (BEPZA)..."
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 min-h-[42px] px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Highlights, Contact & Footer</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};
