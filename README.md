# VendorBridge

VendorBridge is a Procurement and Vendor Management ERP built with the requested stack:

- Frontend: React.js + Tailwind CSS
- Backend: Django + Django REST Framework
- Database: PostgreSQL
- Authentication: JWT
- Security: role-based access control, DRF permissions, rate limiting, audit logs
- Background tasks: Celery
- Cache / queue: Redis
- PDF and invoice generation: WeasyPrint
- Email: SMTP-ready, SendGrid-compatible through Django email settings
- File storage: local storage for MVP, ready for S3/Cloudinary via `django-storages`
- Containerization: Docker + Docker Compose
- API testing: Postman collection

## Run With Docker

Copy the env file:

```powershell
Copy-Item .env.example .env
```

Start the stack:

```powershell
docker compose up --build
```

Create an admin user:

```powershell
docker compose exec backend python manage.py createsuperuser
```

Or seed a complete demo workflow with role-based users:

```powershell
docker compose exec backend python manage.py seed_demo
```

Demo credentials:

```text
admin@example.com / VendorBridge@123
officer@example.com / VendorBridge@123
approver@example.com / VendorBridge@123
vendor@example.com / VendorBridge@123
```

Open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin
- Local email inbox: http://localhost:8025
- Health check: http://localhost:8000/api/health
- Audit timeline: http://localhost:5173/audit-logs

Run API tests:

```powershell
docker compose exec backend python manage.py test
```

## Run Locally Without Docker

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Celery:

```powershell
cd backend
celery -A config worker -l info
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Demo Workflow

1. Sign in with a Django user.
2. Create vendors.
3. Create an RFQ with item details and assigned vendors.
4. Publish the RFQ.
5. Create and submit vendor quotations.
6. Select a quotation for approval.
7. Approve it to generate a purchase order.
8. Generate an invoice from the purchase order.
9. Queue invoice PDF generation and email sending through Celery.

## Permission Matrix

| Capability | Admin | Procurement Officer | Vendor | Manager / Approver |
| --- | --- | --- | --- | --- |
| Manage users | Yes | No | No | No |
| Manage vendors | Yes | Yes | View own profile | View |
| Create and publish RFQs | Yes | Yes | No | View |
| View assigned RFQs | Yes | Yes | Yes | Yes |
| Submit quotations | Yes | Yes | Own vendor only | View |
| Compare quotations | Yes | Yes | Own quotations only | Yes |
| Select quotation for approval | Yes | Yes | No | No |
| Approve or reject procurement | Yes | No | No | Yes |
| Generate purchase orders | Yes | Yes | View related | View |
| Generate invoices | Yes | Yes | View related | View |
| Send invoice email | Yes | Yes | No | No |
| View notifications | Yes | Yes | Own notifications | Yes |
| View audit timeline | Yes | Yes | No | Yes |

## Reliability Design

- Database transactions protect approval, purchase order, invoice, and notification workflows.
- Idempotent workflow APIs prevent duplicate POs and invoices from repeated clicks.
- Optimistic locking on vendors and RFQs prevents accidental overwrite from stale forms.
- Soft delete preserves procurement history.
- Audit logs capture who did what and include old/new values for key updates.
- Redis caches dashboard and analytics responses only; live approval/invoice records stay uncached.
- Pagination is enabled for list APIs with a default page size of 20.

## Deployment Targets

- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase, Neon, Railway PostgreSQL, or managed Postgres
- Redis: managed Redis or platform Redis addon
- Static/media: local for MVP, S3/Cloudinary for production
