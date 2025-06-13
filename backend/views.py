from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import JournalEntry
import json


@csrf_exempt
def get_journal_entries(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        entries = JournalEntry.objects.filter(user=user)
        entries_data = [
            {
                "id": entry.id,
                "title": entry.title,
                "content": entry.content,
                "date": entry.date.isoformat(),
                "updated_at": entry.updated_at.isoformat(),
            }
            for entry in entries
        ]
        return JsonResponse({"entries": entries_data})
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def add_journal_entry(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user = User.objects.get(id=data["user_id"])
            entry = JournalEntry.objects.create(
                user=user,
                title=data.get("title", "Untitled Entry"),
                content=data["content"],
            )
            return JsonResponse(
                {
                    "id": entry.id,
                    "title": entry.title,
                    "content": entry.content,
                    "date": entry.date.isoformat(),
                    "updated_at": entry.updated_at.isoformat(),
                }
            )
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def update_journal_entry(request, entry_id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            entry = JournalEntry.objects.get(id=entry_id)
            entry.title = data.get("title", entry.title)
            entry.content = data.get("content", entry.content)
            entry.save()
            return JsonResponse(
                {
                    "id": entry.id,
                    "title": entry.title,
                    "content": entry.content,
                    "date": entry.date.isoformat(),
                    "updated_at": entry.updated_at.isoformat(),
                }
            )
        except JournalEntry.DoesNotExist:
            return JsonResponse({"error": "Entry not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def delete_journal_entry(request, entry_id):
    if request.method == "DELETE":
        try:
            entry = JournalEntry.objects.get(id=entry_id)
            entry.delete()
            return JsonResponse({"message": "Entry deleted successfully"})
        except JournalEntry.DoesNotExist:
            return JsonResponse({"error": "Entry not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)
