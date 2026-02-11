
import React, { useState } from 'react';
import { X, Save, User, Briefcase, Phone, MapPin, FileText, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';

interface ProfileSettingsProps {
  onClose: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { userProfile, updateUserProfile } = useAppStore();
  
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || '',
    profession: userProfile?.profession || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
    aboutMe: userProfile?.aboutMe || '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateUserProfile(formData);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-secondary-dark p-6 flex justify-between items-center shrink-0">
          <div className="text-white">
            <h2 className="text-2xl font-black">My Profile</h2>
            <p className="opacity-90 text-sm">Tell us who you are!</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form id="profile-form" onSubmit={handleSave} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <User size={14} /> Full Name
              </label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all font-semibold text-slate-700"
                placeholder="e.g. Jane Doe"
              />
            </div>

            {/* Profession & Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Briefcase size={14} /> Profession
                </label>
                <input 
                  type="text" 
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all font-semibold text-slate-700"
                  placeholder="e.g. Developer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Phone size={14} /> Phone
                </label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all font-semibold text-slate-700"
                  placeholder="+1 234..."
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <MapPin size={14} /> Address
              </label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all font-semibold text-slate-700"
                placeholder="City, Country"
              />
            </div>

            {/* About Me */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <FileText size={14} /> About Me
              </label>
              <textarea 
                name="aboutMe"
                value={formData.aboutMe}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 outline-none transition-all font-semibold text-slate-700 resize-none placeholder:font-normal placeholder:text-gray-400"
                placeholder="Tell us who you are and what topics you enjoy discussing..."
              />
              <p className="text-xs text-gray-400 text-right">This helps the AI personalize topics for you.</p>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
            <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="profile-form"
            disabled={saving}
            className="flex-[2] py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-300 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Profile</>}
          </button>
        </div>

      </div>
    </div>
  );
};
