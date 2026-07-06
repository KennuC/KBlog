@echo off
cd C:\Users\Admin\my-blog
start http://localhost:8080
npx quartz build --serve
pause