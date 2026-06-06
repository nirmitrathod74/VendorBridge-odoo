from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import ForgotPasswordView, LoginView, LogoutView, MeView, ResetPasswordView, SignupView, UserViewSet
from apps.procurement.views import (
    ApprovalViewSet,
    AuditLogViewSet,
    InvoiceViewSet,
    NotificationViewSet,
    PurchaseOrderViewSet,
    QuotationViewSet,
    RFQViewSet,
)
from apps.reports.views import DashboardView, HealthCheckView, ReportViewSet
from apps.vendors.views import VendorViewSet

router = DefaultRouter()
router.register("users", UserViewSet)
router.register("vendors", VendorViewSet, basename="vendors")
router.register("rfqs", RFQViewSet, basename="rfqs")
router.register("quotations", QuotationViewSet, basename="quotations")
router.register("approvals", ApprovalViewSet, basename="approvals")
router.register("purchase-orders", PurchaseOrderViewSet, basename="purchase-orders")
router.register("invoices", InvoiceViewSet, basename="invoices")
router.register("notifications", NotificationViewSet, basename="notifications")
router.register("audit-logs", AuditLogViewSet)
router.register("reports", ReportViewSet, basename="reports")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/signup/", SignupView.as_view(), name="signup"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("api/auth/reset-password/", ResetPasswordView.as_view(), name="reset_password"),
    path("api/auth/logout/", LogoutView.as_view(), name="logout"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/health/", HealthCheckView.as_view(), name="health"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
