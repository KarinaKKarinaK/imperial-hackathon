"use client";

import { useCallback, useEffect, useState } from "react";

// Rider-facing strings in the four languages GOVERNANCE.md promises. The ne
// and ur strings are first drafts and need a native speaker check before any
// pilot. zh-HK uses Traditional characters and Hong Kong wording.

export type Lang = "en" | "zh-HK" | "ne" | "ur";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh-HK", label: "中文" },
  { code: "ne", label: "नेपाली" },
  { code: "ur", label: "اردو" },
];

export const isRtl = (l: Lang) => l === "ur";
export const needsReview = (l: Lang) => l === "ne" || l === "ur";

const en = {
  "consent.eyebrow": "Before anything is recorded",
  "consent.title": "Your data. Your record.",
  "consent.b1": "Motion is read only while you are on shift. Off shift, nothing is read.",
  "consent.b2": "Raw motion stays on this phone. Only a crash event leaves it, after 30 seconds of silence from you.",
  "consent.b3": "Your platform never sees your route, speed, heat or fatigue. They see one thing: a verified event, if there is one.",
  "consent.b4": "You can stop at any time. Stopping deletes the buffer.",
  "consent.cta": "I understand, continue",
  "consent.note": "Demo build. No account, no identity. The rider id above is random and lives in this browser.",
  "motion.step": "Step 1",
  "motion.title": "Turn this phone into the sensor.",
  "motion.body": "Allow motion access. iPhone asks once. Then start a shift and drop the phone onto a cushion from about half a metre.",
  "motion.allow": "Allow motion",
  "motion.pairInstead": "Pair the helmet clip instead",
  "motion.denied": "Motion access was refused. Reload and try again, or use the scripted demo.",
  "motion.unsupported": "This browser has no motion sensors. Open this page on a phone.",
  "sensor.phone": "phone sensors",
  "sensor.pair": "Pair helmet",
  "contact.title": "Emergency contact",
  "contact.body": "Stays on this phone. If you do not respond after a crash, one tap texts them your location and the triage note.",
  "footer.see": "See it live on the",
  "footer.demo": "demo",
  "footer.dispatch": "dispatcher screen",
  "withdraw": "Withdraw consent and stop",
  "cancel.tooLate": "Too late to cancel. Your record has gone to dispatch.",
  "cd.eyebrow": "Impact detected",
  "cd.fine": "If you are fine, tap OK. Nothing leaves your phone.",
  "cd.ok": "I'm OK",
  "cd.hold": "Or press and hold anywhere",
  "cd.speak": "Crash detected. If you are fine, tap I'm OK.",
  "cd.silence": "Silence sends your location and a triage note to dispatch.",
  "call999": "Call 999",
  "textContact": "Text my contact",
  "noContact": "No contact set",
  "paid.pill": "Paid",
  "paid.verified": "Verified event {id}. Paid at {time}.",
  "paid.record": "Your record: {platform}, {job}, {time}. You own this.",
  "paid.open": "Open my signed record",
  "shift.label": "Shift",
  "shift.on": "On shift",
  "shift.off": "Off shift",
  "shift.offNote": "Nothing is recorded off shift.",
  "due.label": "Order due in",
  "due.min": "{m} min",
  "due.left": "{t} left",
  "due.late": "{s} s late",
  "due.note": "Written into the record at impact. Nowhere else.",
  "heat.label": "Heat",
  "heat.red": "Red. Rest now.",
  "heat.amber": "Amber. Drink, slow down.",
  "heat.green": "Green",
  "fatigue": "Fatigue",
  "live": "Live sensor",
  "privacy": "Alerts are shown to you only. Your platform never sees heat, fatigue, route or speed.",
};

export type Key = keyof typeof en;

const zhHK: Record<Key, string> = {
  "consent.eyebrow": "開始記錄之前",
  "consent.title": "你的數據，你的紀錄。",
  "consent.b1": "只會喺你返工時讀取動作數據。收工之後，乜都唔會讀。",
  "consent.b2": "原始動作數據只留喺呢部手機。只有撞車事件會傳出，而且要你 30 秒冇回應先會傳。",
  "consent.b3": "平台永遠睇唔到你嘅路線、車速、熱度或疲勞。佢哋只會見到一樣嘢：如有發生，一宗經核實嘅事件。",
  "consent.b4": "你可以隨時停止。停止會刪除緩存數據。",
  "consent.cta": "我明白，繼續",
  "consent.note": "示範版本。冇帳戶，冇身份。上面嘅車手編號係隨機產生，只存喺呢個瀏覽器。",
  "motion.step": "第 1 步",
  "motion.title": "將呢部手機變成感應器。",
  "motion.body": "允許讀取動作感應。iPhone 只會問一次。然後開始返工，將手機由大約半米高跌落軟墊上面。",
  "motion.allow": "允許動作感應",
  "motion.pairInstead": "改為配對頭盔夾",
  "motion.denied": "動作感應被拒絕。請重新載入再試，或者用示範模式。",
  "motion.unsupported": "呢個瀏覽器冇動作感應器。請用手機打開呢頁。",
  "sensor.phone": "手機感應器",
  "sensor.pair": "配對頭盔",
  "contact.title": "緊急聯絡人",
  "contact.body": "只存喺呢部手機。撞車後如果你冇回應，按一下就會將你嘅位置同傷情簡報發短訊俾佢哋。",
  "footer.see": "即時睇吓",
  "footer.demo": "示範",
  "footer.dispatch": "調度畫面",
  "withdraw": "撤回同意並停止",
  "cancel.tooLate": "太遲，已經取消唔到。你嘅紀錄已經送去調度。",
  "cd.eyebrow": "偵測到撞擊",
  "cd.fine": "如果你冇事，請按「我冇事」。乜都唔會傳出。",
  "cd.ok": "我冇事",
  "cd.hold": "或者喺任何位置長按",
  "cd.speak": "偵測到撞車。如果你冇事，請按我冇事。",
  "cd.silence": "冇回應就會將你嘅位置同傷情簡報送去調度。",
  "call999": "打 999",
  "textContact": "發短訊俾聯絡人",
  "noContact": "未設定聯絡人",
  "paid.pill": "已賠付",
  "paid.verified": "已核實事件 {id}。賠付時間 {time}。",
  "paid.record": "你嘅紀錄：{platform}，{job}，{time}。呢份紀錄屬於你。",
  "paid.open": "打開我嘅簽署紀錄",
  "shift.label": "返工",
  "shift.on": "返緊工",
  "shift.off": "收咗工",
  "shift.offNote": "收工時乜都唔會記錄。",
  "due.label": "訂單限時",
  "due.min": "{m} 分鐘",
  "due.left": "剩 {t}",
  "due.late": "遲咗 {s} 秒",
  "due.note": "撞擊時寫入紀錄，唔會用喺其他地方。",
  "heat.label": "熱度",
  "heat.red": "紅色。即刻休息。",
  "heat.amber": "黃色。飲水，慢啲。",
  "heat.green": "綠色",
  "fatigue": "疲勞",
  "live": "即時感應",
  "privacy": "提示只會俾你自己睇。平台永遠睇唔到熱度、疲勞、路線或車速。",
};

const ne: Record<Key, string> = {
  "consent.eyebrow": "केही रेकर्ड हुनुअघि",
  "consent.title": "तपाईंको डाटा। तपाईंको रेकर्ड।",
  "consent.b1": "तपाईं सिफ्टमा हुँदा मात्र चाल पढिन्छ। सिफ्ट बाहिर केही पढिँदैन।",
  "consent.b2": "कच्चा चाल डाटा यही फोनमा रहन्छ। तपाईं 30 सेकेन्ड चुप रहनुभयो भने मात्र दुर्घटनाको घटना बाहिर जान्छ।",
  "consent.b3": "तपाईंको प्लेटफर्मले तपाईंको बाटो, गति, गर्मी वा थकान कहिल्यै देख्दैन। उनीहरूले एउटा कुरा मात्र देख्छन्: प्रमाणित घटना, यदि भयो भने।",
  "consent.b4": "तपाईं जुनसुकै बेला रोक्न सक्नुहुन्छ। रोक्दा बफर मेटिन्छ।",
  "consent.cta": "मैले बुझें, अगाडि बढ्नुहोस्",
  "consent.note": "डेमो संस्करण। खाता छैन, पहिचान छैन। माथिको राइडर आईडी अनियमित हो र यही ब्राउजरमा मात्र रहन्छ।",
  "motion.step": "चरण 1",
  "motion.title": "यो फोनलाई सेन्सर बनाउनुहोस्।",
  "motion.body": "चाल पहुँच दिनुहोस्। iPhone ले एक पटक मात्र सोध्छ। त्यसपछि सिफ्ट सुरु गर्नुहोस् र फोनलाई आधा मिटर उचाइबाट कुसनमा खसाल्नुहोस्।",
  "motion.allow": "चाल पहुँच दिनुहोस्",
  "motion.pairInstead": "बरु हेलमेट क्लिप जोड्नुहोस्",
  "motion.denied": "चाल पहुँच अस्वीकार भयो। पेज फेरि खोलेर प्रयास गर्नुहोस्, वा डेमो प्रयोग गर्नुहोस्।",
  "motion.unsupported": "यो ब्राउजरमा चाल सेन्सर छैन। यो पेज फोनमा खोल्नुहोस्।",
  "sensor.phone": "फोन सेन्सर",
  "sensor.pair": "हेलमेट जोड्नुहोस्",
  "contact.title": "आपतकालीन सम्पर्क",
  "contact.body": "यही फोनमा रहन्छ। दुर्घटनापछि तपाईंले जवाफ दिनुभएन भने, एक ट्यापले उहाँलाई तपाईंको स्थान र चोटको नोट पठाउँछ।",
  "footer.see": "लाइभ हेर्नुहोस्",
  "footer.demo": "डेमो",
  "footer.dispatch": "डिस्प्याचर स्क्रिन",
  "withdraw": "सहमति फिर्ता लिनुहोस् र रोक्नुहोस्",
  "cancel.tooLate": "रद्द गर्न ढिला भयो। तपाईंको रेकर्ड डिस्प्याचमा पुगिसक्यो।",
  "cd.eyebrow": "ठक्कर पत्ता लाग्यो",
  "cd.fine": "तपाईं ठीक हुनुहुन्छ भने OK थिच्नुहोस्। फोनबाट केही बाहिर जाँदैन।",
  "cd.ok": "म ठीक छु",
  "cd.hold": "वा जहाँसुकै थिचिराख्नुहोस्",
  "cd.speak": "दुर्घटना पत्ता लाग्यो। तपाईं ठीक हुनुहुन्छ भने, म ठीक छु थिच्नुहोस्।",
  "cd.silence": "जवाफ नदिए तपाईंको स्थान र चोटको नोट डिस्प्याचमा जान्छ।",
  "call999": "999 मा फोन गर्नुहोस्",
  "textContact": "सम्पर्कलाई SMS पठाउनुहोस्",
  "noContact": "सम्पर्क राखिएको छैन",
  "paid.pill": "भुक्तानी भयो",
  "paid.verified": "प्रमाणित घटना {id}। भुक्तानी समय {time}।",
  "paid.record": "तपाईंको रेकर्ड: {platform}, {job}, {time}। यो तपाईंको हो।",
  "paid.open": "मेरो हस्ताक्षरित रेकर्ड खोल्नुहोस्",
  "shift.label": "सिफ्ट",
  "shift.on": "सिफ्टमा",
  "shift.off": "सिफ्ट बाहिर",
  "shift.offNote": "सिफ्ट बाहिर केही रेकर्ड हुँदैन।",
  "due.label": "अर्डर बाँकी समय",
  "due.min": "{m} मिनेट",
  "due.left": "{t} बाँकी",
  "due.late": "{s} सेकेन्ड ढिलो",
  "due.note": "ठक्करको बेला रेकर्डमा लेखिन्छ। अरू कतै होइन।",
  "heat.label": "गर्मी",
  "heat.red": "रातो। अहिले आराम गर्नुहोस्।",
  "heat.amber": "पहेंलो। पानी पिउनुहोस्, बिस्तारै।",
  "heat.green": "हरियो",
  "fatigue": "थकान",
  "live": "लाइभ सेन्सर",
  "privacy": "सूचनाहरू तपाईंलाई मात्र देखिन्छन्। प्लेटफर्मले गर्मी, थकान, बाटो वा गति कहिल्यै देख्दैन।",
};

const ur: Record<Key, string> = {
  "consent.eyebrow": "کچھ بھی ریکارڈ ہونے سے پہلے",
  "consent.title": "آپ کا ڈیٹا۔ آپ کا ریکارڈ۔",
  "consent.b1": "حرکت صرف تب پڑھی جاتی ہے جب آپ شفٹ پر ہوں۔ شفٹ کے بعد کچھ نہیں پڑھا جاتا۔",
  "consent.b2": "خام حرکت کا ڈیٹا اسی فون پر رہتا ہے۔ صرف حادثے کا واقعہ باہر جاتا ہے، وہ بھی آپ کے 30 سیکنڈ خاموش رہنے کے بعد۔",
  "consent.b3": "آپ کا پلیٹ فارم کبھی آپ کا راستہ، رفتار، گرمی یا تھکن نہیں دیکھتا۔ وہ صرف ایک چیز دیکھتے ہیں: تصدیق شدہ واقعہ، اگر ہو۔",
  "consent.b4": "آپ کسی بھی وقت روک سکتے ہیں۔ روکنے سے بفر مٹ جاتا ہے۔",
  "consent.cta": "میں سمجھ گیا، آگے بڑھیں",
  "consent.note": "ڈیمو ورژن۔ کوئی اکاؤنٹ نہیں، کوئی شناخت نہیں۔ اوپر والی رائیڈر آئی ڈی بے ترتیب ہے اور صرف اسی براؤزر میں رہتی ہے۔",
  "motion.step": "مرحلہ 1",
  "motion.title": "اس فون کو سینسر بنائیں۔",
  "motion.body": "حرکت تک رسائی دیں۔ iPhone ایک بار پوچھتا ہے۔ پھر شفٹ شروع کریں اور فون کو تقریباً آدھے میٹر سے گدے پر گرائیں۔",
  "motion.allow": "حرکت کی اجازت دیں",
  "motion.pairInstead": "اس کے بجائے ہیلمٹ کلپ جوڑیں",
  "motion.denied": "حرکت تک رسائی رد کر دی گئی۔ صفحہ دوبارہ کھول کر کوشش کریں، یا ڈیمو استعمال کریں۔",
  "motion.unsupported": "اس براؤزر میں حرکت کے سینسر نہیں ہیں۔ یہ صفحہ فون پر کھولیں۔",
  "sensor.phone": "فون سینسر",
  "sensor.pair": "ہیلمٹ جوڑیں",
  "contact.title": "ہنگامی رابطہ",
  "contact.body": "اسی فون پر رہتا ہے۔ اگر حادثے کے بعد آپ جواب نہ دیں تو ایک ٹیپ انہیں آپ کا مقام اور چوٹ کا نوٹ بھیج دیتا ہے۔",
  "footer.see": "لائیو دیکھیں",
  "footer.demo": "ڈیمو",
  "footer.dispatch": "ڈسپیچر اسکرین",
  "withdraw": "رضامندی واپس لیں اور روکیں",
  "cancel.tooLate": "منسوخ کرنے میں دیر ہو گئی۔ آپ کا ریکارڈ ڈسپیچ کو جا چکا ہے۔",
  "cd.eyebrow": "ٹکر کا پتا چلا",
  "cd.fine": "اگر آپ ٹھیک ہیں تو OK دبائیں۔ آپ کے فون سے کچھ باہر نہیں جاتا۔",
  "cd.ok": "میں ٹھیک ہوں",
  "cd.hold": "یا کہیں بھی دبا کر رکھیں",
  "cd.speak": "حادثے کا پتا چلا۔ اگر آپ ٹھیک ہیں تو میں ٹھیک ہوں دبائیں۔",
  "cd.silence": "جواب نہ دینے پر آپ کا مقام اور چوٹ کا نوٹ ڈسپیچ کو جاتا ہے۔",
  "call999": "999 پر کال کریں",
  "textContact": "رابطے کو میسج کریں",
  "noContact": "کوئی رابطہ نہیں",
  "paid.pill": "ادائیگی ہو گئی",
  "paid.verified": "تصدیق شدہ واقعہ {id}۔ ادائیگی کا وقت {time}۔",
  "paid.record": "آپ کا ریکارڈ: {platform}، {job}، {time}۔ یہ آپ کا ہے۔",
  "paid.open": "میرا دستخط شدہ ریکارڈ کھولیں",
  "shift.label": "شفٹ",
  "shift.on": "شفٹ پر",
  "shift.off": "شفٹ ختم",
  "shift.offNote": "شفٹ کے بعد کچھ ریکارڈ نہیں ہوتا۔",
  "due.label": "آرڈر کا باقی وقت",
  "due.min": "{m} منٹ",
  "due.left": "{t} باقی",
  "due.late": "{s} سیکنڈ تاخیر",
  "due.note": "ٹکر کے وقت ریکارڈ میں لکھا جاتا ہے۔ کہیں اور نہیں۔",
  "heat.label": "گرمی",
  "heat.red": "سرخ۔ ابھی آرام کریں۔",
  "heat.amber": "پیلا۔ پانی پئیں، آہستہ چلیں۔",
  "heat.green": "سبز",
  "fatigue": "تھکن",
  "live": "لائیو سینسر",
  "privacy": "الرٹ صرف آپ کو دکھائے جاتے ہیں۔ پلیٹ فارم کبھی گرمی، تھکن، راستہ یا رفتار نہیں دیکھتا۔",
};

const TABLE: Record<Lang, Record<Key, string>> = { en, "zh-HK": zhHK, ne, ur };

// Lookup with English fallback. {name} placeholders are filled from vars.
export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s = TABLE[lang]?.[key] || en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

const STORE = "mf-lang";
const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.code === v);

// Starts in English so server and client render the same, then picks up the
// saved choice.
export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORE);
      if (isLang(v)) setLangState(v);
    } catch {}
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORE, l);
    } catch {}
  }, []);
  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
  return { lang, setLang, t };
}
