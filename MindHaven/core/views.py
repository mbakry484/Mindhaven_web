from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
from bson import ObjectId
from .models import (
    BlogPosts,
    JournalEntries,
    Users,
    Comments,
    Exercises,
    ChatLogs,
    ActivityLogs,
    Challenges,
    HappyUserTracking,
)
import traceback
from .models import MoodLogs
from datetime import datetime
from bson import ObjectId
from datetime import datetime
from django.conf import settings
import os
import sys
from bson.errors import InvalidId


@csrf_exempt
def get_blog_posts(request):
    if request.method == "GET":
        try:
            posts_cursor = BlogPosts.get_posts(sort_by_date=True)
            posts_list = []

            for post in posts_cursor:
                user = Users.find_by_id(post["user_id"])
                author_name = user.get("name", "Anonymous") if user else "Anonymous"
                profile_image = (
                    user.get("profile_image", Users.DEFAULT_PROFILE_IMAGE)
                    if user
                    else Users.DEFAULT_PROFILE_IMAGE
                )
                # Count comments for this post
                comment_count = Comments.get_collection().count_documents(
                    {"post_id": post["_id"]}
                )

                post_data = {
                    "_id": str(post["_id"]),
                    "user_id": str(post["user_id"]),
                    "title": post.get("title", ""),
                    "content": post.get("content", ""),
                    "is_anonymous": post.get("is_anonymous", False),
                    "author_name": (
                        "Anonymous" if post.get("is_anonymous") else author_name
                    ),
                    "image": None if post.get("is_anonymous") else profile_image,
                    "like_count": post.get("like_count", 0),
                    "comment_count": comment_count,
                    "created_at": post["created_at"].isoformat(),
                    "likes": [
                        {
                            "user_id": str(like["user_id"]),
                            "created_at": like["created_at"].isoformat(),
                        }
                        for like in post.get("likes", [])
                    ],
                }
                # Add images field if present
                if "images" in post:
                    post_data["images"] = post["images"]
                posts_list.append(post_data)

            return JsonResponse({"blog_posts": posts_list})

        except Exception as e:
            print(f"Error in get_blog_posts: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def create_blog_post(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            images = data.get("images", [])
            result = BlogPosts.create_post(
                user_id=data["user_id"],
                title=data["title"],
                content=data["content"],
                is_anonymous=data.get("is_anonymous", False),
                images=images,
            )

            return JsonResponse(
                {
                    "success": True,
                    "message": "Post created successfully",
                    "post_id": str(result.inserted_id),
                    "images": images,
                }
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def toggle_like(request, post_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")

            if not user_id:
                return JsonResponse({"error": "User ID is required"}, status=400)

            liked = BlogPosts.add_like(post_id, user_id)

            return JsonResponse({"success": True, "liked": liked})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def user_profile(request):
    if request.method == "GET":
        try:
            # Assuming you have a way to identify the current user, e.g., through a session or token
            user = Users.find_by_id(
                "current_user_id"
            )  # Replace 'current_user_id' with actual user identification logic

            if user:
                # Calculate mood stats (this is a placeholder, you'll need to implement this based on your actual data)
                mood_stats = 75  # Example value

                return JsonResponse(
                    {
                        "name": user["name"],
                        "email": user["email"],
                        "profileImage": "default_profile_image_url",  # Replace with actual image URL
                        "moodStats": mood_stats,
                    }
                )
            else:
                return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return JsonResponse(
                    {"error": "Email and password are required"}, status=400
                )

            # Only use MongoDB for authentication
            user = Users.find_by_email(email)
            if user and Users.verify_password(user, password):
                return JsonResponse(
                    {
                        "message": "Login successful",
                        "user_id": str(user["_id"]),
                    },
                    status=200,
                )
            else:
                return JsonResponse(
                    {"error": "Email or password is incorrect"}, status=401
                )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Create your views here.
@csrf_exempt  # Needed for POST requests from external clients
def add_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            # Extract values from the data dictionary
            name = data.get("name")
            email = data.get("email")
            password = data.get("password")
            preferences = data.get("preferences", {})

            # Use the create_user method from our MongoDB model
            result = Users.create_user(
                name=name, email=email, password=password, preferences=preferences
            )

            return JsonResponse(
                {
                    "message": "User added successfully",
                    "user_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# --- Profile Image Upload ---
@csrf_exempt
def upload_profile_image(request, user_id):
    if request.method == "POST":
        try:
            print(f"Received upload request for user {user_id}")
            print(f"Request FILES: {request.FILES}")
            print(f"Request POST: {request.POST}")
            print(f"Request content type: {request.content_type}")

            user = Users.find_by_id(user_id)
            if not user:
                return JsonResponse({"error": "User not found"}, status=404)

            if "profile_image" not in request.FILES:
                print("No profile_image in request.FILES")
                print(f"Available files: {list(request.FILES.keys())}")
                return JsonResponse({"error": "No image file provided"}, status=400)

            image_file = request.FILES["profile_image"]
            print(
                f"Received file: {image_file.name}, size: {image_file.size}, content_type: {image_file.content_type}"
            )

            # Create profile_images directory if it doesn't exist
            profile_images_dir = os.path.join(settings.MEDIA_ROOT, "profile_images")
            os.makedirs(profile_images_dir, exist_ok=True)
            print(f"Profile images directory: {profile_images_dir}")

            # Generate unique filename using user_id
            file_extension = os.path.splitext(image_file.name)[1]
            filename = f"profile_{user_id}{file_extension}"
            file_path = os.path.join("profile_images", filename)
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            print(f"Saving file to: {full_path}")

            # Save the file
            with open(full_path, "wb+") as destination:
                for chunk in image_file.chunks():
                    destination.write(chunk)

            # Build the absolute URL
            domain = request.build_absolute_uri("/")[:-1]  # removes trailing slash
            full_url = f"{domain}/media/profile_images/{filename}"
            Users.update_profile_image(user_id, full_url)
            print(f"Updated user profile image in database: {full_url}")

            # Return the same path in the response
            return JsonResponse(
                {
                    "profile_image": full_url,
                    "message": "Profile image updated successfully",
                },
                status=200,
            )

        except Exception as e:
            print(f"Error in upload_profile_image: {str(e)}")
            import traceback

            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)


def get_user(request, user_id):
    if request.method == "GET":
        try:
            # Find user by ID
            user = Users.find_by_id(user_id)

            if user:
                # Convert ObjectId to string for JSON serialization
                user["_id"] = str(user["_id"])
                # Add default profile image if none exists
                if "profile_image" not in user:
                    user["profile_image"] = (
                        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                    )
                return JsonResponse(user)
            else:
                return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_all(request):
    if request.method == "GET":
        try:
            # Get all users and convert cursor to list
            users_cursor = Users.get_all()
            users_list = []

            # Convert each document to be JSON serializable
            for user in users_cursor:
                # Convert ObjectId to string
                user["_id"] = str(user["_id"])
                users_list.append(user)

            return JsonResponse({"users": users_list}, safe=True)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# MoodLogs Views
@csrf_exempt
def add_mood_log(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            date = data.get("date")
            mood = data.get("mood")
            notes = data.get("notes", "")
            score = data.get("score")

            result = MoodLogs.create_log(
                user_id=user_id, date=date, mood=mood, notes=notes, score=score
            )

            return JsonResponse(
                {
                    "message": "Mood log added successfully",
                    "log_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_mood_logs(request, user_id):
    if request.method == "GET":
        try:
            logs_cursor = MoodLogs.find_by_user(user_id)
            logs_list = []

            for log in logs_cursor:
                log["_id"] = str(log["_id"])
                log["user_id"] = str(log["user_id"])
                logs_list.append(log)

            return JsonResponse({"mood_logs": logs_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Journal Entries Views
@csrf_exempt
def add_journal_entry(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            content = data.get("content")
            title = data.get("title", "Untitled Entry")

            result = JournalEntries.create_entry(
                user_id=user_id, content=content, title=title
            )

            return JsonResponse(
                {
                    "message": "Journal entry added successfully",
                    "entry_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_journal_entries(request, user_id):
    if request.method == "GET":
        try:
            # Sort by date descending (most recent first)
            entries_cursor = (
                JournalEntries.get_collection()
                .find({"user_id": ObjectId(user_id)})
                .sort("date", -1)
            )
            entries_list = []

            for entry in entries_cursor:
                entry["_id"] = str(entry["_id"])
                entry["user_id"] = str(entry["user_id"])
                if "title" not in entry or not entry["title"]:
                    entry["title"] = "Untitled Entry"
                # Ensure date is an ISO string
                if "date" in entry and entry["date"]:
                    if isinstance(entry["date"], str):
                        entry["date"] = entry["date"]
                    else:
                        entry["date"] = entry["date"].isoformat()
                else:
                    entry["date"] = datetime.utcnow().isoformat()
                entries_list.append(entry)

            return JsonResponse({"journal_entries": entries_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def update_journal_entry(request, entry_id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            update_fields = {}
            if "content" in data:
                update_fields["content"] = data["content"]
            if "title" in data:
                update_fields["title"] = data["title"]
            if not update_fields:
                return JsonResponse({"error": "No fields to update"}, status=400)
            from .models import JournalEntries

            result = JournalEntries.get_collection().update_one(
                {"_id": ObjectId(entry_id)}, {"$set": update_fields}
            )
            if result.matched_count == 0:
                return JsonResponse({"error": "Entry not found"}, status=404)
            return JsonResponse({"message": "Journal entry updated successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def delete_journal_entry(request, entry_id):
    if request.method == "DELETE":
        try:
            from .models import JournalEntries
            from bson import ObjectId

            print(f"Trying to delete entry with _id: {entry_id}")
            try:
                obj_id = ObjectId(entry_id)
            except InvalidId:
                print(f"Invalid ObjectId: {entry_id}")
                return JsonResponse({"error": "Invalid entry id"}, status=400)
            result = JournalEntries.get_collection().delete_one({"_id": obj_id})
            if result.deleted_count == 0:
                print(f"Entry not found for _id: {entry_id}")
                return JsonResponse({"error": "Entry not found"}, status=404)
            print(f"Deleted entry with _id: {entry_id}")
            return JsonResponse({"message": "Journal entry deleted successfully"})
        except Exception as e:
            print(f"Error deleting entry: {e}")
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)


# Comments Views
@csrf_exempt
def add_comment(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            post_id = data.get("post_id")
            user_id = data.get("user_id")
            content = data.get("content")

            if not all([post_id, user_id, content]):
                return JsonResponse({"error": "Missing required fields"}, status=400)

            try:
                result, comment_doc = Comments.create_comment(
                    post_id=post_id, user_id=user_id, content=content
                )

                return JsonResponse(
                    {
                        "message": "Comment added successfully",
                        "comment_id": str(result.inserted_id),
                        "comment": {
                            "post_id": str(post_id),
                            "user_id": str(user_id),
                            "content": content,
                            "created_at": comment_doc["created_at"].isoformat(),
                            "user_name": comment_doc["user_name"],
                            "user_image": comment_doc["user_image"],
                        },
                    },
                    status=201,
                )

            except Exception as e:
                return JsonResponse({"error": f"Database error: {str(e)}"}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def get_post_comments(request, post_id):
    if request.method == "GET":
        try:
            comments_cursor = Comments.get_comments_for_post(post_id)
            comments_list = []

            for comment in comments_cursor:
                user = Users.find_by_id(comment["user_id"])
                user_name = user.get("name", "Anonymous") if user else "Anonymous"
                comments_list.append(
                    {
                        "_id": str(comment["_id"]),
                        "user_id": str(comment["user_id"]),
                        "post_id": str(comment["post_id"]),
                        "content": comment["content"],
                        "created_at": comment["created_at"].isoformat(),
                        "user_name": user_name,
                        "user_name": comment.get("user_name", "Unknown"),
                        "user_image": comment.get("user_image", None),
                    }
                )

            return JsonResponse({"comments": comments_list})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def toggle_comment_like(request, comment_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")

            if not user_id:
                return JsonResponse({"error": "User ID is required"}, status=400)

            result = Comments.add_like(comment_id, user_id)

            return JsonResponse(
                {
                    "success": True,
                    "liked": result["liked"],
                    "like_count": result["like_count"],
                }
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Exercises Views
@csrf_exempt
def add_exercise(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            name = data.get("name")
            type = data.get("type")
            duration = data.get("duration")
            completed = data.get("completed", False)

            # Prevent duplicate exercises for the same user, name, and type
            existing = Exercises.get_collection().find_one(
                {"user_id": ObjectId(user_id), "name": name, "type": type}
            )
            if existing:
                return JsonResponse(
                    {
                        "message": "Exercise already exists",
                        "exercise_id": str(existing["_id"]),
                        "duplicate": True,
                    },
                    status=200,
                )

            result = Exercises.create_exercise(
                user_id=user_id,
                name=name,
                type=type,
                duration=duration,
                completed=completed,
            )
            print("saved successfully")

            return JsonResponse(
                {
                    "message": "Exercise added successfully",
                    "exercise_id": str(result.inserted_id),
                    "duplicate": False,
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_exercises(request, user_id):
    if request.method == "GET":
        try:
            exercises_cursor = Exercises.find({"user_id": ObjectId(user_id)})
            exercises_list = []

            for exercise in exercises_cursor:
                exercise["_id"] = str(exercise["_id"])
                exercise["user_id"] = str(exercise["user_id"])
                exercises_list.append(exercise)

            return JsonResponse({"exercises": exercises_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def exercise_exists(request):
    """
    POST endpoint to check if an activity (exercise) already exists for a user (case-insensitive, any language).
    Expects JSON: {"user_id": ..., "activity_name": ...}
    Returns: {"exists": true/false}
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            activity_name = data.get("activity_name")
            if not user_id or not activity_name:
                return JsonResponse(
                    {"error": "user_id and activity_name are required"}, status=400
                )
            # Check both possible field names: 'activity' and 'activity_name'
            query = {
                "user_id": ObjectId(user_id),
                "$or": [
                    {"activity": {"$regex": f"^{activity_name}$", "$options": "i"}},
                    {
                        "activity_name": {
                            "$regex": f"^{activity_name}$",
                            "$options": "i",
                        }
                    },
                ],
            }
            exists = ActivityLogs.get_collection().find_one(query) is not None
            return JsonResponse({"exists": exists})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)


# Challenges Views
@csrf_exempt
def add_challenge(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            name = data.get("name")
            description = data.get("description")
            type = data.get("type")
            duration = data.get("duration")
            start_date = data.get("start_date")
            end_date = data.get("end_date")
            status = data.get("status", "pending")

            result = Challenges.create_challenge(
                user_id=user_id,
                name=name,
                description=description,
                type=type,
                duration=duration,
                start_date=start_date,
                end_date=end_date,
                status=status,
            )

            return JsonResponse(
                {
                    "message": "Challenge added successfully",
                    "challenge_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_challenges(request, user_id):
    if request.method == "GET":
        try:
            challenges_cursor = Challenges.find({"user_id": ObjectId(user_id)})
            challenges_list = []

            for challenge in challenges_cursor:
                challenge["_id"] = str(challenge["_id"])
                challenge["user_id"] = str(challenge["user_id"])
                challenges_list.append(challenge)

            return JsonResponse({"challenges": challenges_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Chat Logs Views
@csrf_exempt
def add_chat_log(request):
    if request.method == "POST":
        try:
            print("[add_chat_log] Raw body:", request.body, file=sys.stderr)
            data = json.loads(request.body)
            print("[add_chat_log] Parsed data:", data, file=sys.stderr)
            user_id = data.get("user_id")
            message = data.get("message")
            sender = data.get("sender")

            result = ChatLogs.create_log(
                user_id=user_id, message=message, sender=sender
            )

            print("[add_chat_log] Saved successfully", file=sys.stderr)
            return JsonResponse(
                {
                    "message": "Chat log added successfully",
                    "log_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            import traceback

            print("[add_chat_log] Exception:", str(e), file=sys.stderr)
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_chat_logs(request, user_id):
    if request.method == "GET":
        try:
            logs_cursor = ChatLogs.find({"user_id": ObjectId(user_id)})
            logs_list = []

            for log in logs_cursor:
                log["_id"] = str(log["_id"])
                log["user_id"] = str(log["user_id"])
                logs_list.append(log)

            return JsonResponse({"chat_logs": logs_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Happy User Tracking Views
@csrf_exempt
def add_happy_tracking(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            date = data.get("date")
            trigger = data.get("trigger")
            context = data.get("context")

            result = HappyUserTracking.create_tracking(
                user_id=user_id, date=date, trigger=trigger, context=context
            )

            return JsonResponse(
                {
                    "message": "Happy tracking added successfully",
                    "tracking_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_happy_tracking(request, user_id):
    if request.method == "GET":
        try:
            tracking_cursor = HappyUserTracking.find({"user_id": ObjectId(user_id)})
            tracking_list = []

            for tracking in tracking_cursor:
                tracking["_id"] = str(tracking["_id"])
                tracking["user_id"] = str(tracking["user_id"])
                tracking_list.append(tracking)

            return JsonResponse({"happy_tracking": tracking_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Mood Summaries Views
@csrf_exempt
def add_mood_summary(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            start_date = data.get("start_date")
            end_date = data.get("end_date")
            summary = data.get("summary")

            result = MoodSummaries.create_summary(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                summary=summary,
            )

            return JsonResponse(
                {
                    "message": "Mood summary added successfully",
                    "summary_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_mood_summaries(request, user_id):
    if request.method == "GET":
        try:
            summaries_cursor = MoodSummaries.find({"user_id": ObjectId(user_id)})
            summaries_list = []

            for summary in summaries_cursor:
                summary["_id"] = str(summary["_id"])
                summary["user_id"] = str(summary["user_id"])
                summaries_list.append(summary)

            return JsonResponse({"mood_summaries": summaries_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def update_default_profile_images(request):
    if request.method == "POST":
        try:
            # Update all users without profile images
            updated_count = Users.set_default_profile_images()
            return JsonResponse(
                {
                    "message": f"Updated {updated_count} users with default profile images",
                    "updated_count": updated_count,
                }
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def add_activity_log(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            activity = data.get("activity")
            is_positive = data.get("is_positive", True)
            date_str = data.get("date", datetime.now().isoformat())

            if not user_id or not activity:
                return JsonResponse(
                    {"error": "User ID and activity are required"}, status=400
                )

            # Handle date parsing with timezone
            try:
                # Remove 'Z' if present and parse the date
                date_str = date_str.replace("Z", "+00:00")
                date = datetime.fromisoformat(date_str)
            except ValueError:
                # If parsing fails, use current time
                date = datetime.now()

            # Create activity log document
            activity_log = {
                "user_id": ObjectId(user_id),
                "activity": activity,
                "is_positive": is_positive,
                "date": date,
                "created_at": datetime.now(),
            }

            # Insert into database
            result = ActivityLogs.get_collection().insert_one(activity_log)

            return JsonResponse(
                {
                    "success": True,
                    "message": "Activity logged successfully",
                    "activity_log_id": str(result.inserted_id),
                }
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_activity_logs(request, user_id):
    if request.method == "GET":
        try:
            # Get all activity logs for the user
            activity_logs = list(
                ActivityLogs.get_collection()
                .find({"user_id": ObjectId(user_id)})
                .sort("date", -1)
            )

            # Convert ObjectId to string for JSON serialization
            for log in activity_logs:
                log["_id"] = str(log["_id"])
                log["user_id"] = str(log["user_id"])
                log["date"] = log["date"].isoformat()
                log["created_at"] = log["created_at"].isoformat()

            return JsonResponse({"activity_logs": activity_logs})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def delete_blog_post(request, post_id):
    if request.method == "DELETE":
        try:
            BlogPosts.delete(post_id)
            return JsonResponse(
                {"success": True, "message": "Post deleted successfully"}
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def list_apis(request):
    """
    List all available API endpoints in the application.
    """
    if request.method == "GET":
        api_endpoints = {
            "user": {
                "login": "/api/login/",
                "add_user": "/api/add_user/",
                "get_user": "/api/get_user/<user_id>/",
                "get_all": "/api/get_all/",
                "upload_profile_image": "/api/upload_profile_image/<user_id>/",
            },
            "mood": {
                "add_mood_log": "/api/add_mood_log/",
                "get_user_mood_logs": "/api/get_user_mood_logs/<user_id>/",
            },
            "journal": {
                "add_journal_entry": "/api/add_journal_entry/",
                "get_user_journal_entries": "/api/get_user_journal_entries/<user_id>/",
            },
            "blog": {
                "get_blog_posts": "/api/get_blog_posts/",
                "create_blog_post": "/api/create_blog_post/",
                "toggle_like": "/api/toggle_like/<post_id>/",
                "delete_blog_post": "/api/delete_blog_post/<post_id>/",
            },
            "comments": {
                "add_comment": "/api/add_comment/",
                "get_post_comments": "/api/get_post_comments/<post_id>/",
                "toggle_comment_like": "/api/toggle_comment_like/<comment_id>/",
            },
            "exercises": {
                "add_exercise": "/api/add_exercise/",
                "get_user_exercises": "/api/get_user_exercises/<user_id>/",
            },
            "challenges": {
                "add_challenge": "/api/add_challenge/",
                "get_user_challenges": "/api/get_user_challenges/<user_id>/",
            },
            "chat": {
                "add_chat_log": "/api/add_chat_log/",
                "get_user_chat_logs": "/api/get_user_chat_logs/<user_id>/",
            },
        }
        return JsonResponse(api_endpoints)
    return JsonResponse({"error": "Invalid request method"}, status=405)


#
