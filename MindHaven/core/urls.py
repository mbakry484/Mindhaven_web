from django.urls import path
from . import views

urlpatterns = [
    path(
        "api/upload_profile_image/<str:user_id>/",
        views.upload_profile_image,
        name="upload_profile_image",
    ),
    path(
        "api/get_journal_entries/<str:user_id>/",
        views.get_user_journal_entries,
        name="get_user_journal_entries",
    ),
    path(
        "api/delete_journal_entry/<str:entry_id>/",
        views.delete_journal_entry,
        name="delete_journal_entry",
    ),
    path(
        "api/update_journal_entry/<str:entry_id>/",
        views.update_journal_entry,
        name="update_journal_entry",
    ),
]
