from django.urls import path
from . import views

urlpatterns = [
    # ... existing urls ...
    path(
        "api/get_journal_entries/<str:user_id>/",
        views.get_journal_entries,
        name="get_journal_entries",
    ),
    path("api/add_journal_entry/", views.add_journal_entry, name="add_journal_entry"),
    path(
        "api/update_journal_entry/<int:entry_id>/",
        views.update_journal_entry,
        name="update_journal_entry",
    ),
    path(
        "api/delete_journal_entry/<int:entry_id>/",
        views.delete_journal_entry,
        name="delete_journal_entry",
    ),
]
