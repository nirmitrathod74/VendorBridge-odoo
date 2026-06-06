from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsOfficerOrAdmin

from .models import Vendor
from .serializers import VendorSerializer
from .services import create_vendor, soft_delete_vendor, update_vendor


class VendorViewSet(viewsets.ModelViewSet):
    serializer_class = VendorSerializer
    filterset_fields = ["status", "category"]
    search_fields = ["name", "company_name", "email", "gst_number"]
    ordering_fields = ["created_at", "rating", "company_name"]

    def get_queryset(self):
        queryset = Vendor.objects.filter(is_deleted=False).order_by("-created_at")
        user = self.request.user
        if user.is_superuser or user.role in {"admin", "officer", "approver"}:
            return queryset
        return queryset.filter(user=user)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsOfficerOrAdmin()]

    def perform_create(self, serializer):
        create_vendor(serializer, self.request.user)

    def perform_update(self, serializer):
        before = VendorSerializer(serializer.instance).data
        update_vendor(serializer, self.request.user, before, lambda vendor: VendorSerializer(vendor).data)

    def perform_destroy(self, instance):
        soft_delete_vendor(instance, self.request.user)
