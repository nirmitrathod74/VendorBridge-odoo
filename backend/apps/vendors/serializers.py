from rest_framework import serializers

from .models import Vendor


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        if self.instance and "version" in self.initial_data:
            incoming_version = int(self.initial_data["version"])
            if incoming_version != self.instance.version:
                raise serializers.ValidationError({
                    "version": "This vendor was changed by someone else. Refresh and try again."
                })
        return attrs

    def update(self, instance, validated_data):
        validated_data["version"] = instance.version + 1
        return super().update(instance, validated_data)
