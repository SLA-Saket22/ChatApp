// Keywords that signal important messages
const KEYWORDS = {
    exam:       ["exam", "test", "quiz", "viva", "practical"],
    deadline:   ["deadline", "due", "submit", "submission", "last date"],
    meeting:    ["meeting", "seminar", "lecture", "class", "session"],
    urgent:     ["urgent", "important", "asap", "immediately", "tomorrow"],
};

const DAY_MAP = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
};

// Extract nearest future date from message text
export const extractDate = (text) => {
    const lower = text.toLowerCase();
    const today = new Date();

    // "tomorrow"
    if (lower.includes("tomorrow")) {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return d;
    }

    // "today"
    if (lower.includes("today")) {
        const d = new Date(today);
        d.setHours(23, 59, 0, 0);
        return d;
    }

    // Day names: "on monday", "this friday"
    for (const [day, dayNum] of Object.entries(DAY_MAP)) {
        if (lower.includes(day)) {
            const d = new Date(today);
            const diff = (dayNum - d.getDay() + 7) % 7 || 7;
            d.setDate(d.getDate() + diff);
            d.setHours(9, 0, 0, 0);
            return d;
        }
    }

    // "in X days"
    const inDaysMatch = lower.match(/in (\d+) days?/);
    if (inDaysMatch) {
        const d = new Date(today);
        d.setDate(d.getDate() + parseInt(inDaysMatch[1]));
        d.setHours(9, 0, 0, 0);
        return d;
    }

    // "DD/MM" or "MM/DD"
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
        const d = new Date(today.getFullYear(), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
        if (d >= today) return d;
    }

    return null;
};

// Detect if message is important and what type
export const detectReminder = (text) => {
    const lower = text.toLowerCase();
    let detectedType = null;

    for (const [type, words] of Object.entries(KEYWORDS)) {
        if (words.some(w => lower.includes(w))) {
            detectedType = type;
            break;
        }
    }

    if (!detectedType) return null;

    const date = extractDate(text);

    return {
        type: detectedType === "urgent" ? "other" : detectedType,
        date,
        isImportant: true,
    };
};