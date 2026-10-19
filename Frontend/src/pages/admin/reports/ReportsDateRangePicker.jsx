import React, { useState, useEffect, useRef } from 'react';
import {
    FiCalendar, FiChevronLeft, FiChevronRight, FiChevronDown,
    FiCheck, FiX, FiClock
} from 'react-icons/fi';

const PRESETS = [
    {
        label: 'Today',
        getValue: () => {
            const today = new Date().toISOString().split('T')[0];
            return { startDate: today, endDate: today };
        }
    },
    {
        label: 'Yesterday',
        getValue: () => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            const str = d.toISOString().split('T')[0];
            return { startDate: str, endDate: str };
        }
    },
    {
        label: 'Last 7 Days',
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 6);
            return {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            };
        }
    },
    {
        label: 'Last 30 Days',
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 29);
            return {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            };
        }
    },
    {
        label: 'This Month',
        getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return {
                startDate: start.toISOString().split('T')[0],
                endDate: now.toISOString().split('T')[0]
            };
        }
    },
    {
        label: 'Last Month',
        getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
            };
        }
    },
    {
        label: 'This Year',
        getValue: () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            return {
                startDate: start.toISOString().split('T')[0],
                endDate: now.toISOString().split('T')[0]
            };
        }
    }
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_HEADER = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
        const [y, m, d] = dateStr.split('-');
        const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
};

const toDateString = (year, month, day) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const ReportsDateRangePicker = ({ dateRange, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const [tempStart, setTempStart] = useState(dateRange?.startDate || '');
    const [tempEnd, setTempEnd] = useState(dateRange?.endDate || '');
    const [selectingStep, setSelectingStep] = useState('start'); // 'start' | 'end'

    // Calendar view month and year
    const initialDate = dateRange?.endDate ? new Date(dateRange.endDate) : new Date();
    const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth() || new Date().getMonth());

    // Sync from props
    useEffect(() => {
        if (dateRange?.startDate) setTempStart(dateRange.startDate);
        if (dateRange?.endDate) setTempEnd(dateRange.endDate);
    }, [dateRange]);

    // Outside click listener
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                // Reset temp values back to confirmed props
                setTempStart(dateRange?.startDate || '');
                setTempEnd(dateRange?.endDate || '');
                setSelectingStep('start');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, dateRange]);

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(v => v - 1);
        } else {
            setViewMonth(v => v - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(v => v + 1);
        } else {
            setViewMonth(v => v + 1);
        }
    };

    const handleSelectDay = (dayStr) => {
        if (selectingStep === 'start' || (tempStart && tempEnd)) {
            setTempStart(dayStr);
            setTempEnd('');
            setSelectingStep('end');
        } else {
            // Selecting end date
            if (dayStr < tempStart) {
                // Swap if clicked earlier date
                setTempEnd(tempStart);
                setTempStart(dayStr);
            } else {
                setTempEnd(dayStr);
            }
            setSelectingStep('start');
        }
    };

    const handleApplyPreset = (preset) => {
        const val = preset.getValue();
        setTempStart(val.startDate);
        setTempEnd(val.endDate);
        setSelectingStep('start');
        // Update view month
        const endD = new Date(val.endDate);
        setViewYear(endD.getFullYear());
        setViewMonth(endD.getMonth());
    };

    const handleApply = () => {
        if (!tempStart) return;
        const finalEnd = tempEnd || tempStart;
        onChange({ startDate: tempStart, endDate: finalEnd });
        setIsOpen(false);
    };

    // Calculate calendar days for viewMonth and viewYear
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const calendarCells = [];

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
        const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
        calendarCells.push({
            day: d,
            isCurrentMonth: false,
            dateStr: toDateString(prevYear, prevMonth, d)
        });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push({
            day: d,
            isCurrentMonth: true,
            dateStr: toDateString(viewYear, viewMonth, d)
        });
    }

    // Next month padding days to make full weeks
    const remaining = (7 - (calendarCells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
        const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
        calendarCells.push({
            day: d,
            isCurrentMonth: false,
            dateStr: toDateString(nextYear, nextMonth, d)
        });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                    isOpen
                        ? 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
                title="Select date range"
            >
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FiCalendar className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                    <span className="text-slate-800 font-bold">
                        {formatDateLabel(dateRange.startDate)}
                    </span>
                    <span className="text-slate-400 mx-1.5 font-normal">to</span>
                    <span className="text-slate-800 font-bold">
                        {formatDateLabel(dateRange.endDate)}
                    </span>
                </div>
                <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {/* Mobile Backdrop Overlay (only on mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 sm:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Calendar Popover Dropdown */}
            {isOpen && (
                <div
                    className="absolute right-0 sm:right-0 top-full mt-2 z-50 w-[340px] sm:w-[540px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150"
                    style={{ maxHeight: '90vh' }}
                >
                    {/* Header: Range Display */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Date Range</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-3.5">

                        {/* Presets Column */}
                        <div className="sm:w-36 shrink-0 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none border-b sm:border-b-0 sm:border-r border-slate-100 sm:pr-3">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block mb-1">
                                Quick Presets
                            </span>
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => handleApplyPreset(preset)}
                                    className="px-2.5 py-1.5 text-xs text-left rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50/70 transition font-medium whitespace-nowrap shrink-0"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Calendar Column */}
                        <div className="flex-1">

                            {/* Month & Year Navigation */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                    title="Previous Month"
                                >
                                    <FiChevronLeft className="w-4 h-4" />
                                </button>

                                <span className="text-xs sm:text-sm font-bold text-slate-800">
                                    {MONTHS[viewMonth]} {viewYear}
                                </span>

                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                    title="Next Month"
                                >
                                    <FiChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Days of Week Header */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                {DAYS_HEADER.map((d) => (
                                    <span key={d} className="text-[11px] font-bold text-slate-400 py-1">
                                        {d}
                                    </span>
                                ))}
                            </div>

                            {/* Calendar Days Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {calendarCells.map((cell, idx) => {
                                    const { dayStr, isCurrentMonth, day, dateStr } = cell;

                                    const isStart = dateStr === tempStart;
                                    const isEnd = dateStr === tempEnd;
                                    const isInRange = tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd;
                                    const isToday = dateStr === todayStr;

                                    let cellClass = 'text-slate-700 hover:bg-blue-50';
                                    if (!isCurrentMonth) {
                                        cellClass = 'text-slate-300 hover:bg-slate-50';
                                    }
                                    if (isStart || isEnd) {
                                        cellClass = 'bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700';
                                    } else if (isInRange) {
                                        cellClass = 'bg-blue-50 text-blue-700 font-semibold rounded-none';
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectDay(dateStr)}
                                            className={`h-8 w-full rounded-lg text-xs flex items-center justify-center transition-colors relative ${cellClass} ${
                                                isToday && !isStart && !isEnd ? 'border border-blue-400 font-bold' : ''
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Range Preview Inputs */}
                            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-700">
                                    <span className="text-slate-400 block text-[9px] uppercase font-sans">From</span>
                                    {tempStart || 'Start Date'}
                                </div>
                                <span className="text-slate-400 font-medium">to</span>
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-700">
                                    <span className="text-slate-400 block text-[9px] uppercase font-sans">To</span>
                                    {tempEnd || tempStart || 'End Date'}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                const defaultPast = new Date();
                                defaultPast.setDate(defaultPast.getDate() - 29);
                                const startStr = defaultPast.toISOString().split('T')[0];
                                const endStr = new Date().toISOString().split('T')[0];
                                setTempStart(startStr);
                                setTempEnd(endStr);
                            }}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
                        >
                            Reset Range
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApply}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
                            >
                                <FiCheck className="w-3.5 h-3.5" /> Apply Range
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsDateRangePicker;
