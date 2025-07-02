@echo off
echo 🗑️ حذف الملفات غير المرغوبة...
rmdir /s /q "whatsapp_botjs\.wwebjs_auth"
rmdir /s /q "whatsapp_botjs\.wwebjs_cache"
rmdir /s /q "whatsapp_botjs\node_modules"
rmdir /s /q "venv"

echo 🚀 رفع الملفات إلى GitHub...
git add .
git commit -m "Auto-upload: %date% %time%"
git push origin main

echo ✅ تم الانتهاء بنجاح!
pause