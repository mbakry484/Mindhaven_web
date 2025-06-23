import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
  Pressable,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Svg, Path } from 'react-native-svg';
import { API_URLS } from "../config/apiConfig";
import { useUser } from "../UserContext";
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import '../i18n';

const { width, height } = Dimensions.get("window");

// Avatar component for consistent styling
const Avatar = ({ source, size = 40, style, onError }) => (
  <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2 }, style]}>
    <Image
      source={source}
      style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
      resizeMode="cover"
      onError={onError}
    />
  </View>
);

// Create a LikeIcon component after the Avatar component
const LikeIcon = ({ liked, size = 24 }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={liked ? "#E53E3E" : "#626A7C"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={liked ? "#E53E3E" : "none"}
      />
    </Svg>
  );
};

// Add these icon components after the LikeIcon component
const CommentIcon = ({ size = 22, style, fill = false }) => {
  const fillColor = fill ? "#F0F2F5" : "none";
  const strokeColor = "#626A7C";

  return (
    <View style={[style, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </Svg>
    </View>
  );
};

const ShareIcon = ({ size = 22, style }) => (
  <View style={[style, { width: size, height: size }]}>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#626A7C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <Path d="M16 6l-4-4-4 4" />
      <Path d="M12 2v13" />
    </Svg>
  </View>
);

// Button component with various styles
const Button = ({
  title,
  onPress,
  type = "primary",
  size = "medium",
  disabled = false,
  icon = null,
  iconPosition = "left"
}) => {
  const getButtonStyle = () => {
    let style = [styles.button];

    if (type === "primary") {
      style.push(styles.buttonPrimary);
    } else if (type === "secondary") {
      style.push(styles.buttonSecondary);
    } else if (type === "ghost") {
      style.push(styles.buttonGhost);
    }

    if (size === "small") {
      style.push(styles.buttonSmall);
    } else if (size === "large") {
      style.push(styles.buttonLarge);
    }

    if (disabled) {
      style.push(styles.buttonDisabled);
    }

    return style;
  };

  const getTextStyle = () => {
    let style = [styles.buttonText];

    if (type === "primary") {
      style.push(styles.buttonTextPrimary);
    } else if (type === "secondary") {
      style.push(styles.buttonTextSecondary);
    } else if (type === "ghost") {
      style.push(styles.buttonTextGhost);
    }

    if (size === "small") {
      style.push(styles.buttonTextSmall);
    } else if (size === "large") {
      style.push(styles.buttonTextLarge);
    }

    if (disabled) {
      style.push(styles.buttonTextDisabled);
    }

    return style;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && iconPosition === "left" && (
        <View style={styles.buttonIconLeft}>{icon}</View>
      )}
      <Text style={getTextStyle()}>{title}</Text>
      {icon && iconPosition === "right" && (
        <View style={styles.buttonIconRight}>{icon}</View>
      )}
    </TouchableOpacity>
  );
};

// Header with navigation and branding
const Header = ({ onProfilePress }) => {
  const { user } = useUser();
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.push("/home")}
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.headerLogo}
          />
          <Text style={styles.headerTitle}>MindHaven</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onProfilePress} style={styles.profileButton}>
          <Avatar
            source={
              imageError || !user?.profile_image
                ? require("../../assets/images/no-profile.png")
                : { uri: user.profile_image }
            }
            size={36}
            onError={() => setImageError(true)}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Create post component
const CreatePostCard = ({ onCreatePost }) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageError, setImageError] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(t('blog.permission_needed'), t('blog.grant_photo_permission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', t('blog.error_picking_image'));
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", t('blog.title_required'));
      return;
    }

    onCreatePost(title, content, selectedImages);
    setTitle("");
    setContent("");
    setSelectedImages([]);
    setIsExpanded(false);
  };

  return (
    <View style={styles.createPostCard}>
      {!isExpanded ? (
        <Pressable
          style={styles.createPostCollapsed}
          onPress={() => setIsExpanded(true)}
        >
          <Avatar
            source={
              imageError || !user?.profile_image
                ? require("../../assets/images/no-profile.png")
                : { uri: user.profile_image }
            }
            size={40}
            onError={() => setImageError(true)}
          />
          <View style={styles.createPostPrompt}>
            <Text style={styles.createPostPromptText}>{t('blog.share_thoughts')}</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.createPostExpanded}>
          <View style={styles.createPostHeader}>
            <Text style={styles.createPostTitle}>{t('blog.create_post')}</Text>
            <TouchableOpacity onPress={() => {
              setIsExpanded(false);
              setSelectedImages([]);
            }}>
              <Text style={styles.createPostCancel}>{t('blog.cancel')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.createPostForm}>
            <TextInput
              style={styles.createPostTitleInput}
              placeholder={t('blog.add_title')}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9E9E9E"
              maxLength={100}
            />

            <TextInput
              style={styles.createPostContentInput}
              placeholder={t('blog.whats_on_mind')}
              value={content}
              onChangeText={setContent}
              multiline
              placeholderTextColor="#9E9E9E"
              textAlignVertical="top"
            />

            {selectedImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.selectedImagesContainer}
              >
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.selectedImageWrapper}>
                    <Image source={{ uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.createPostActions}>
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
              >
                <Text style={styles.addImageButtonText}>{t('blog.add_photo')}</Text>
              </TouchableOpacity>
              <Button
                title={t('blog.post')}
                onPress={handlePost}
                disabled={!title.trim() || !content.trim()}
                size="medium"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// Post card component for displaying a single blog post
const PostCard = ({
  post,
  onLike,
  onComment,
  onShare,
  comments,
  likedPosts,
  fetchComments,
  handleCommentLike,
  likedComments,
  onDelete,
  user_id,
}) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isCommentsLoaded, setIsCommentsLoaded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const {
    _id,
    author_name,
    title,
    content,
    created_at,
    like_count = 0,
    comment_count = 0,
    is_anonymous,
    image,
  } = post;

  const isLiked = likedPosts[_id] || false;
  const postComments = comments[_id] || [];

  // Format date to "Apr 24, 2024" format
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    : t('blog.recent');

  useEffect(() => {
    if (showComments && !isCommentsLoaded) {
      fetchComments(_id);
      setIsCommentsLoaded(true);
    }

    // Create parallel animations for a smoother effect
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: showComments ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showComments, isCommentsLoaded, _id, fetchComments]);

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleSubmitComment = () => {
    if (commentInput.trim()) {
      onComment(_id, commentInput);
      setCommentInput("");
    }
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = () => {
    if (!isLiked) {
      animateHeart();
    }
    onLike(_id);
  };

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Avatar
          source={
            imageError || !image
              ? require("../../assets/images/no-profile.png")
              : { uri: image }
          }
          size={44}
          onError={() => setImageError(true)}
        />
        <View style={styles.postHeaderInfo}>
          <Text style={styles.postAuthor}>
            {is_anonymous ? t('blog.anonymous') : author_name || t('blog.unknown_user')}
          </Text>
          <Text style={styles.postDate}>{formattedDate}</Text>
        </View>
        {/* 3-dots menu for post owner */}
        {user_id === post.user_id && (
          <View style={{ marginLeft: 'auto', position: 'relative' }}>
            <TouchableOpacity
              onPress={() => {
                setShowMenu(!showMenu);
                console.log('3-dots menu clicked for post', post._id);
              }}
              style={{ padding: 8 }}
            >
              <MaterialIcons name="more-vert" size={24} color="#626A7C" />
            </TouchableOpacity>
            {showMenu && (
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  onPress={() => {
                    setShowMenu(false);
                    console.log('Delete button clicked for post', post._id);
                    onDelete(post._id);
                  }}
                  style={styles.menuDeleteButton}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="delete" size={20} color="#E53E3E" style={{ marginRight: 6 }} />
                    <Text style={styles.menuDeleteText}>{t('blog.delete')}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{title}</Text>
        <Text style={styles.postText}>{content}</Text>
        {post.images && post.images.length > 0 && (
          <ScrollView horizontal style={{ marginTop: 10 }}>
            {post.images.map((imgUrl, idx) => (
              <Image
                key={idx}
                source={{ uri: imgUrl }}
                style={{ width: 180, height: 180, borderRadius: 12, marginRight: 8 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Simple Likes/Comments Count */}
      <View style={styles.simpleLikesContainer}>
        <View style={styles.simpleLikeRow}>
          <TouchableOpacity
            onPress={handleLike}
            activeOpacity={0.7}
            style={styles.likeIconContainer}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <LikeIcon liked={isLiked} size={14} />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.simpleLikeCount}>{like_count}</Text>
        </View>

        <View style={styles.simpleCountsRow}>
          {like_count > 0 && (
            <Text style={styles.simpleLikesText}>
              {like_count === 1 ? `1 ${t('blog.like_singular')}` : `${like_count} ${t('blog.likes')}`}
            </Text>
          )}

          {like_count > 0 && comment_count > 0 && (
            <Text style={styles.simpleDotText}>•</Text>
          )}

          {comment_count > 0 && (
            <TouchableOpacity onPress={toggleComments} activeOpacity={0.7}>
              <Text style={styles.simpleLikesText}>
                {comment_count === 1 ? `1 ${t('blog.comment_singular')}` : `${comment_count} ${t('blog.comments_plural')}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Divider Line */}
      <View style={styles.divider} />

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={[styles.postActionButton, isLiked && styles.postActionButtonActive]}
          onPress={handleLike}
        >
          <LikeIcon liked={isLiked} size={20} />
          <Text style={[styles.postActionText, isLiked && styles.postActionTextLiked]}>{t('blog.like')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postActionButton, showComments && styles.postActionButtonActive]}
          onPress={toggleComments}
        >
          <CommentIcon
            size={20}
            fill={showComments}
          />
          <Text style={[styles.postActionText, showComments && styles.postActionTextActive]}>{t('blog.comment')}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      <Animated.View
        style={[
          styles.commentsContainer,
          {
            maxHeight: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 350]
            }),
            opacity: slideAnim,
          }
        ]}
      >
        {showComments && (
          <>
            <View style={styles.divider} />

            <View style={styles.commentsSectionHeader}>
              <Text style={styles.commentsSectionTitle}>
                {t('blog.comments')} {postComments.length > 0 ? `(${postComments.length})` : ''}
              </Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Text style={styles.commentsSectionHide}>{t('blog.hide')}</Text>
              </TouchableOpacity>
            </View>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <Avatar
                source={
                  imageError || !user?.profile_image
                    ? require("../../assets/images/no-profile.png")
                    : { uri: user.profile_image }
                }
                size={36}
                onError={() => setImageError(true)}
              />
              <View style={styles.commentInputWrapper}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={t('blog.write_comment')}
                  value={commentInput}
                  onChangeText={setCommentInput}
                  multiline
                />
                {commentInput.trim() && (
                  <TouchableOpacity
                    style={styles.sendCommentButton}
                    onPress={handleSubmitComment}
                  >
                    <Text style={styles.sendCommentButtonText}>{t('blog.post')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Comments List */}
            {postComments.length > 0 ? (
              <ScrollView
                style={styles.commentsScrollView}
                contentContainerStyle={styles.commentsScrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                bounces={false}
                indicatorStyle="black"
              >
                {postComments.map((item, index) => (
                  <CommentItem
                    key={`comment-${item._id || index}`}
                    comment={item}
                    onLike={handleCommentLike}
                    isLiked={likedComments[item._id] || false}
                  />
                ))}
                <View style={{ height: 4 }} />
                {postComments.length > 3 && (
                  <View style={styles.moreCommentsIndicator}>
                    <Text style={styles.moreCommentsText}>{t('blog.scroll_more_comments')}</Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.noCommentsContainer}>
                <Text style={styles.noCommentsText}>
                  {t('blog.no_comments_yet')}
                </Text>
              </View>
            )}
          </>
        )}
      </Animated.View>
    </View>
  );
};

// Comment component
const CommentItem = ({ comment, onLike, isLiked }) => {
  const { user } = useUser();
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const formattedDate = comment.created_at
    ? new Date(comment.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    : t('blog.recent');

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Avatar
          source={
            imageError || !comment.user_image
              ? require("../../assets/images/no-profile.png")
              : { uri: comment.user_image }
          }
          size={32}
          onError={() => setImageError(true)}
        />
        <View style={styles.commentInfo}>
          <Text style={styles.commentAuthor}>
            {comment.user_name || t('blog.anonymous')}
          </Text>
          <Text style={styles.commentDate}>{formattedDate}</Text>
        </View>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <TouchableOpacity
        style={[styles.commentLikeButton, isLiked && styles.commentLikeButtonActive]}
        onPress={() => onLike(comment._id)}
      >
        <View style={styles.commentLikeContent}>
          <LikeIcon liked={isLiked} size={14} />
          <Text style={[
            styles.commentLikeText,
            isLiked && styles.commentLikeTextLiked
          ]}>
            {isLiked ? t('blog.like') : t('blog.like')} {comment.like_count > 0 && `· ${comment.like_count}`}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Main blog feed component
const BlogScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [user_id, setUserId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [likedComments, setLikedComments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserId();
    fetchPosts();
  }, []);

  const fetchUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (userId !== null) {
        setUserId(userId);
      } else {
        Alert.alert("Error", t('blog.user_not_logged_in'));
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user_id:", error);
      Alert.alert("Error", error.message);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URLS.BLOG_POSTS);
      if (!response.ok) throw new Error(t('blog.failed_fetch_posts'));
      const data = await response.json();
      setPosts(Array.isArray(data.blog_posts) ? data.blog_posts : []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error", error.message || t('blog.failed_fetch_posts'));
      setPosts([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreatePost = async (title, content, images = []) => {
    if (!title || !content) {
      Alert.alert("Error", t('blog.title_required'));
      return;
    }

    if (!user_id) {
      Alert.alert("Error", t('blog.user_id_required'));
      return;
    }

    try {
      // Convert images to base64 first
      let base64Images = [];
      if (images.length > 0) {
        console.log('Converting images to base64...');
        const imagePromises = images.map(async (uri) => {
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.error('Error converting image to base64:', error);
            return null;
          }
        });

        base64Images = (await Promise.all(imagePromises)).filter(img => img !== null);
        console.log(`Successfully converted ${base64Images.length} images to base64`);
      }

      // Create post data with images
      const postData = {
        user_id: user_id,
        title: title,
        content: content,
        is_anonymous: false,
        images: base64Images
      };

      console.log('Sending post data with images:', {
        ...postData,
        imagesCount: base64Images.length
      });

      const response = await fetch(API_URLS.CREATE_POST, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.message || t('blog.failed_create_post'));
      }

      const responseData = await response.json();
      console.log('Post created successfully:', responseData);

      fetchPosts();
      Alert.alert("Success", t('blog.post_published'));
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || t('blog.failed_create_post'));
    }
  };

  const handlePostLike = async (postId) => {
    if (!user_id) {
      Alert.alert("Error", t('blog.must_login_like'));
      return;
    }

    // Optimistically update UI first for a snappier feeling
    const currentLikedState = likedPosts[postId] || false;
    const newLikedState = !currentLikedState;

    // Update the likedPosts state immediately
    setLikedPosts(prev => ({
      ...prev,
      [postId]: newLikedState
    }));

    // Also update the post in the posts array
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId
          ? {
            ...post,
            like_count: post.like_count + (newLikedState ? 1 : -1),
            isLiked: newLikedState,
          }
          : post
      )
    );

    try {
      const response = await fetch(`${API_URLS.TOGGLE_LIKE}${postId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id }),
      });

      if (!response.ok) {
        // If the request failed, revert changes
        setLikedPosts(prev => ({
          ...prev,
          [postId]: currentLikedState
        }));

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? {
                ...post,
                like_count: post.like_count + (currentLikedState ? 1 : -1),
                isLiked: currentLikedState,
              }
              : post
          )
        );

        throw new Error(t('blog.failed_toggle_like'));
      }

      // Server might return a different state than we expected
      // Update with the server's response if different
      if (data.liked !== newLikedState) {
        setLikedPosts(prev => ({
          ...prev,
          [postId]: data.liked
        }));

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? {
                ...post,
                like_count: data.like_count || post.like_count,
                isLiked: data.liked,
              }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", error.message);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await fetch(`${API_URLS.POST_COMMENTS}${postId}/`);
      if (!response.ok) throw new Error(t('blog.failed_fetch_comments'));
      const data = await response.json();
      setComments(prev => ({
        ...prev,
        [postId]: data.comments,
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", t('blog.failed_fetch_comments'));
    }
  };

  const handleCommentTextChange = (postId, text) => {
    setCommentText((prev) => ({
      ...prev,
      [postId]: text,
    }));
  };

  const handleSubmitComment = async (postId, text) => {
    if (!text?.trim()) {
      Alert.alert("Error", t('blog.comment_empty'));
      return;
    }

    if (!user_id) {
      Alert.alert("Error", t('blog.must_login_comment'));
      return;
    }

    try {
      const response = await fetch(API_URLS.ADD_COMMENT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          user_id: user_id,
          content: text,
        }),
      });

      if (!response.ok) {
        throw new Error(t('blog.failed_submit_comment'));
      }

      setCommentText((prev) => ({
        ...prev,
        [postId]: "",
      }));

      await fetchComments(postId);
      Alert.alert("Success", t('blog.comment_added'));
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const response = await fetch(`${API_URLS.TOGGLE_COMMENT_LIKE}${commentId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id }),
      });

      if (!response.ok) throw new Error(t('blog.failed_toggle_comment_like'));
      // Refresh comments for all posts that might have this comment
      // This is a simplified approach - in a real app you might want to track which post the comment belongs to
      Object.keys(comments).forEach(postId => {
        fetchComments(postId);
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleShare = (postId) => {
    Alert.alert("Share", t('blog.share_coming_soon'));
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`${API_URLS.DELETE_POST}${postId}/`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(t('blog.failed_delete_post'));
      }
      console.log('Post deleted:', postId);
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', error.message || t('blog.failed_delete_post'));
    }
  };

  // Render post list or empty state
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5100F3" />
          <Text style={styles.loadingText}>{t('blog.loading_posts')}</Text>
        </View>
      );
    }

    if (!posts || posts.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Image
            source={require("../../assets/images/post1.png")}
            style={styles.emptyStateImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyStateTitle}>{t('blog.no_posts_yet')}</Text>
          <Text style={styles.emptyStateMessage}>
            {t('blog.be_first_share')}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={posts.filter(post => post.title && post.content)}
        keyExtractor={(item) => item._id || Math.random().toString()}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handlePostLike}
            onComment={handleSubmitComment}
            onShare={handleShare}
            comments={comments}
            likedPosts={likedPosts}
            fetchComments={fetchComments}
            handleCommentLike={handleCommentLike}
            likedComments={likedComments}
            onDelete={handleDeletePost}
            user_id={user_id}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
        contentContainerStyle={styles.postsContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header onProfilePress={handleProfilePress} />
      <View style={styles.container}>
        <CreatePostCard onCreatePost={handleCreatePost} />
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

// Improved styling with professional design system
const styles = StyleSheet.create({
  // Layout & Containers
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  postsContainer: {
    paddingBottom: 24,
  },
  postSeparator: {
    height: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#E9EEF6",
    marginVertical: 12,
  },

  // Header styles
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9EEF6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5100F3",
  },
  profileButton: {
    padding: 4,
  },

  // Avatar styles
  avatarContainer: {
    backgroundColor: "#E9EEF6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Button styles
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: "#5100F3",
  },
  buttonSecondary: {
    backgroundColor: "#F0F2F5",
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonLarge: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    backgroundColor: "#C4C9D4",
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttonTextPrimary: {
    color: "#FFFFFF",
  },
  buttonTextSecondary: {
    color: "#5100F3",
  },
  buttonTextGhost: {
    color: "#5100F3",
  },
  buttonTextSmall: {
    fontSize: 13,
  },
  buttonTextLarge: {
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: "#8A929F",
  },
  buttonIconLeft: {
    marginRight: 8,
  },
  buttonIconRight: {
    marginLeft: 8,
  },

  // Create post card styles
  createPostCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    margin: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  createPostHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2A2E38",
  },
  createPostCancel: {
    fontSize: 15,
    color: "#5100F3",
    fontWeight: "500",
  },
  createPostForm: {
    marginTop: 8,
  },
  createPostTitleInput: {
    backgroundColor: "#F7F9FC",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#2A2E38",
    marginBottom: 12,
  },
  createPostContentInput: {
    backgroundColor: "#F7F9FC",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#626A7C",
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  createPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  createPostInput: {
    flex: 1,
    padding: 16,
  },
  createPostPlaceholder: {
    color: "#626A7C",
    fontSize: 15,
  },
  createPostCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  createPostPrompt: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  createPostPromptText: {
    color: "#626A7C",
    fontSize: 15,
  },
  createPostExpanded: {
    padding: 16,
  },

  // Post card styles
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postHeaderInfo: {
    marginLeft: 12,
    justifyContent: "center",
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A2E38",
  },
  postDate: {
    fontSize: 13,
    color: "#626A7C",
    marginTop: 2,
  },
  postContent: {
    paddingHorizontal: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2A2E38",
    marginBottom: 8,
    lineHeight: 24,
  },
  postText: {
    fontSize: 15,
    color: "#4F5663",
    lineHeight: 22,
  },
  postMetrics: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  postMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  postMetricsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  postMetricsItemActive: {
    backgroundColor: "#F4EFFF",
  },
  postMetricsText: {
    fontSize: 14,
    color: "#626A7C",
    fontWeight: "500",
    marginLeft: 4,
  },
  postMetricsTextActive: {
    color: "#5100F3",
    fontWeight: "600",
  },
  postMetricsDetailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postMetricsDetail: {
    fontSize: 13,
    color: "#626A7C",
  },
  postMetricsDetailLink: {
    color: "#5100F3",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  postActionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
  },
  postActionButtonActive: {
    backgroundColor: "#F4EFFF",
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  postActionIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  postActionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#626A7C",
  },
  postActionTextLiked: {
    color: "#E53E3E",
    fontWeight: "600",
  },
  postActionTextActive: {
    color: "#5100F3",
    fontWeight: "600",
  },

  // Comments section styles
  commentsContainer: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  commentsScrollView: {
    maxHeight: 220,
    marginTop: 8,
  },
  commentsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  commentInputWrapper: {
    flex: 1,
    marginLeft: 12,
    position: "relative",
  },
  commentInput: {
    backgroundColor: "#F0F2F5",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 50,
    fontSize: 14,
    color: "#2A2E38",
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#E0E5EC",
  },
  sendCommentButton: {
    position: "absolute",
    right: 8,
    top: 8,
  },
  sendCommentButtonText: {
    color: "#5100F3",
    fontWeight: "600",
    fontSize: 14,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E38',
  },
  commentsSectionHide: {
    fontSize: 14,
    color: '#5100F3',
    fontWeight: '500',
  },
  noCommentsContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noCommentsText: {
    color: "#626A7C",
    fontSize: 14,
    fontStyle: "italic",
  },
  moreCommentsIndicator: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  moreCommentsText: {
    fontSize: 12,
    color: '#8996A8',
    fontStyle: 'italic',
  },

  // Comment item styles
  commentItem: {
    marginBottom: 12,
    backgroundColor: "#F7F9FC",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#EAEEF3",
  },
  commentHeader: {
    flexDirection: "row",
    marginBottom: 6,
  },
  commentInfo: {
    marginLeft: 8,
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2A2E38",
  },
  commentDate: {
    fontSize: 12,
    color: "#626A7C",
    marginTop: 1,
  },
  commentContent: {
    fontSize: 14,
    color: "#4F5663",
    lineHeight: 20,
    marginBottom: 8,
  },
  commentLikeButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  commentLikeButtonActive: {
    backgroundColor: "#F4EFFF",
  },
  commentLikeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#626A7C",
  },
  commentLikeTextLiked: {
    color: "#E53E3E",
  },
  commentLikeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Empty states & loading
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#626A7C",
  },
  emptyStateImage: {
    width: 150,
    height: 150,
    opacity: 0.9,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2A2E38",
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: "#626A7C",
    textAlign: "center",
    lineHeight: 22,
  },

  // Comment count badge styles
  commentCountBadge: {
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  commentCountText: {
    fontSize: 11,
    color: "#626A7C",
    fontWeight: "500",
  },

  // New styles for simple likes and comments count
  simpleLikesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  simpleLikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  likeIconContainer: {
    marginRight: 4,
  },
  simpleLikeCount: {
    fontSize: 13,
    color: '#626A7C',
    fontWeight: '500',
  },
  simpleCountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simpleLikesText: {
    fontSize: 13,
    color: '#626A7C',
  },
  simpleDotText: {
    fontSize: 13,
    color: '#626A7C',
    marginHorizontal: 4,
  },

  selectedImagesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  selectedImageWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E53E3E',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F2F5',
    marginRight: 12,
  },
  addImageButtonText: {
    color: '#5100F3',
    fontSize: 14,
    fontWeight: '600',
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
    minWidth: 120,
  },
  menuDeleteButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EEF6',
  },
  menuDeleteText: {
    color: '#E53E3E',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BlogScreen;
