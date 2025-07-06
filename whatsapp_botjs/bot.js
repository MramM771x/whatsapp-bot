const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// إضافة express لسيرفر بسيط
const express = require('express');
const app = express();

const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('امسح الكود بالواتساب من الأجهزة المرتبطة.');
});

client.on('ready', () => {
    console.log('بوت الواتساب جاهز!');
});

client.on('message', async msg => {
    try {
        if (msg.from.endsWith('@g.us')) {
            const chat = await msg.getChat();
            const sender = await msg.getContact();
            const participants = chat.participants;
            const senderId = sender.id._serialized;

            // تأكد أن البوت نفسه مشرف
            const myId = client.info.wid._serialized;
            const meParticipant = participants.find(p => p.id._serialized === myId);
            if (!(meParticipant && (meParticipant.isAdmin || meParticipant.isSuperAdmin))) {
                console.log('⚠️ البوت ليس مشرفاً ولا يستطيع الطرد أو الحذف.');
                return;
            }

            // تحقق هل المرسل مشرف
            const isSenderAdmin = participants.some(p =>
                p.id._serialized === senderId && (p.isAdmin || p.isSuperAdmin)
            );

            // إذا كان المرسل مشرف، تجاهل الرسالة تماماً
            if (isSenderAdmin) {
                return;
            }

            // إذا كان عضو عادي، أرسل الرسالة إلى بايثون للفحص
            const response = await axios.post('http://localhost:5000/check', {
                message: msg.body,
                type: msg.type,
                from: msg.from,
                sender_id: senderId,
                message_id: msg.id._serialized
            });

            if (response.data.action === "kick") {
                // حذف الرسالة أولاً
                try {
                    await msg.delete(true);
                    console.log(`🗑️ تم حذف الرسالة المخالفة.`);
                } catch (e) {
                    console.log('تعذر حذف الرسالة (قد تكون محذوفة بالفعل)');
                }

                // ثم طرد العضو
                try {
                    await chat.removeParticipants([senderId]);
                    console.log(`🚫 تم طرد العضو: ${sender.pushname || sender.number}`);
                } catch (e) {
                    // تجاهل الخطأ (واتساب يرفض طرد المشرفين أو في حال خطأ آخر)
                    console.log('تعذر الطرد (قد يكون العضو مشرفاً أو هناك مشكلة في الصلاحيات)');
                }
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
});

client.initialize();

// سيرفر بسيط على المنفذ المطلوب من Render
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Whatsapp bot is running!');
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server listening on port ${PORT}`);
});
