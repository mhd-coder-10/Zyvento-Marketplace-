
// src/utils/useSettings.js
import { useState, useEffect } from 'react';
import ApiService from '../api/ApiService';


export const useSettings = (group) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await ApiService.getSettingsByGroup(group);
            if (res.data.success) {
                const mapped = {};
                res.data.data.forEach(item => {
                    mapped[item.key] = item.value;
                });
                setSettings(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [group]);

    const updateSettings = async (newSettings) => {
        try {
            const res = await ApiService.updateSettingsByGroup(group, newSettings);
            if (res.data.success) {
                setSettings(newSettings);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to update settings:', error);
            return false;
        }
    };

    return { settings, loading, updateSettings, refetch: fetchSettings };
};