# My App UAT

## Authentication

- [ ] Login with valid credentials redirects to dashboard (route: /login)
- [ ] Invalid credentials show error message (route: /login)
- [ ] Password reset sends email (route: /forgot-password)
- [ ] Logout clears session and redirects to login (route: /dashboard)

## Dashboard

- [ ] Charts render without console errors (route: /dashboard)
- [ ] Data loads within 2 seconds (route: /dashboard)
- [ ] Empty state shown when no data available (route: /dashboard)

## User Management

- [ ] Can create new user with all required fields (route: /admin/users/new)
- [ ] User list pagination works correctly (route: /admin/users)
- [ ] Can edit existing user details (route: /admin/users)
- [ ] Delete user shows confirmation dialog (route: /admin/users)
