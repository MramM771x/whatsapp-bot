from flask import Flask, request, jsonify
import re
import os

app = Flask(__name__)

# قوائم الكلمات والروابط والعبارات الممنوعة والمسموح بها
banned_keywords = [
    "خاص", "اعلان", "إعلان", "اعلانات", "إعلانات", "خدمات طلابية", "تواصل خاص", "للتواصل خاص"
]
banned_links = [
    "wa.me", "whatsapp.com", "chat.whatsapp.com"
]
banned_announcement = [
    "اعلان", "إعلان", "اعلانات", "إعلانات"
]
banned_phrases = [
    "للتواصل راسلني خاص", "لمن يرغب خاص"
]

# قائمة الروابط المسموح بها (whitelist)
whitelist_links = [
    "https://drive.google.com/drive/folders/1c40p5WAeMbC0xqMcb1PFj8nrosp94q3b",
    "https://drive.google.com/drive/folders/",
    # أضف أي رابط تريد السماح به هنا
]

def is_whitelisted(message):
    for allowed_link in whitelist_links:
        if allowed_link in message:
            return True
    return False

def contains_banned_content(message, msg_type):
    msg = message.strip().lower()
    # كلمات ممنوعة
    if any(word in msg for word in banned_keywords):
        return True
    # عبارات ممنوعة
    if any(phrase in msg for phrase in banned_phrases):
        return True
    # روابط واتساب
    if any(link in msg for link in banned_links):
        return True
    # أي رابط (غير مسموح)
    if re.search(r'https?://[^\s]+', msg):
        return True
    # إعلان (كلمة واحدة فقط)
    if any(word == msg for word in banned_announcement):
        return True
    # جهة اتصال (نوع الرسالة)
    if msg_type in ("vcard", "contact"):
        return True
    # رقم دولي سعودي أو هندي أو مصري أو إماراتي (مثال: +966, +91, +20, +971)
    if re.search(r'(\+966|\+91|\+20|\+971)\d{7,}', msg):
        return True
    # أرقام بصيغة 00966 أو 0091 أو 0020 أو 00971 أيضاً
    if re.search(r'(00966|0091|0020|966|91|967|971|00971)\d{7,}', msg):
        return True
    # منشن شخص
    if re.search(r'@\w+', message):
        return True
    return False

@app.route("/check", methods=["POST"])
def check():
    data = request.json
    message = data.get("message", "")
    msg_type = data.get("type", "")

    # السماح بالرسائل التي تحتوي على رابط في whitelist
    if is_whitelisted(message):
        return jsonify({"action": "ok"})

    if contains_banned_content(message, msg_type):
        return jsonify({"action": "kick"})
    else:
        return jsonify({"action": "ok"})

if __name__ == "__main__":
    # دعم متغير البيئة PORT لكي تعمل الخدمة على Render أو أي استضافة سحابية
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)