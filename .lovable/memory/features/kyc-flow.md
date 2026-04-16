---
name: KYC Registration Flow
description: New users register → submit KYC at /apply → super admin approves → user becomes restaurant_admin → creates own restaurant
type: feature
---
- New signups default to 'customer' role, redirected to /apply
- KYC form: restaurant name, phone, address, business license, TIN, ID doc upload, biz reg upload
- Documents stored in kyc-documents storage bucket
- Super admin reviews in KYC tab: approve (upgrades role to restaurant_admin) or reject (with reason)
- Approved admins see CreateRestaurantPanel on /admin to set up their restaurant
- Orders now include section (Indoor/Outdoor/VIP) and table_number fields
