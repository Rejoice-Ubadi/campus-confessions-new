const SUPABASE_URL = "https://wydorusxawwdnnkcwywh.supabase.co";
const SUPABASE_KEY = "sb_publishable_gZRfRzbV5JYOroL0tlaFKQ_5g9uqugi";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function testSupabase() {
    const { data, error } = await supabaseClient
        .from("Posts")
        .select("*");

    if (error) {
        console.error("Supabase connection failed:", error);
        return;
    }

    console.log("Supabase connected!");
    console.log("Posts:", data);
}

testSupabase();

// =========================
// SHARE SOMETHING
// =========================

const postModal = document.getElementById("postModal");
const closeModal = document.getElementById("closeModal");
const postContent = document.getElementById("postContent");
const submitPost = document.getElementById("submitPost");
const postMessage = document.getElementById("postMessage");
const characterCount = document.getElementById("characterCount");

let selectedCategory = "Confessions";

// Find the "Share Something" button and plus button
const shareButtons = Array.from(document.querySelectorAll("button"));

const shareButton = shareButtons.find(button =>
    button.textContent.trim().includes("Share Something")
);
const plusButton = document.querySelector(".plus-btn");

const openShareModal = () => {
    if (!postModal) return;
    postModal.classList.add("show");
    if (postContent) postContent.focus();
};

// Open modal from Share Something
if (shareButton) {
    shareButton.addEventListener("click", openShareModal);
}

// Open modal from plus button
if (plusButton) {
    plusButton.addEventListener("click", openShareModal);
}

// Close modal
closeModal.addEventListener("click", () => {
    postModal.classList.remove("show");
});

// Close when clicking outside the modal
postModal.addEventListener("click", (event) => {
    if (event.target === postModal) {
        postModal.classList.remove("show");
    }
});

// Category selection
const categoryButtons = document.querySelectorAll(".category-option");

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        categoryButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedCategory = button.dataset.category;
    });

});

// Character counter
postContent.addEventListener("input", () => {
    characterCount.textContent = postContent.value.length;
});

// Submit post
submitPost.addEventListener("click", async () => {

    const content = postContent.value.trim();

    // Don't allow empty posts
    if (!content) {
        postMessage.textContent = "Please write something first.";
        postMessage.style.color = "#ff6b6b";
        return;
    }

    submitPost.disabled = true;
    submitPost.textContent = "Posting...";

    postMessage.textContent = "";

    // Send post to Supabase
    const { data, error } = await supabaseClient
        .from("Posts")
        .insert([
            {
                content: content,
                category: selectedCategory
            }
        ])
        .select();

    if (error) {

    console.error("ERROR CREATING POST:", error);

    postMessage.textContent = error.message;

    postMessage.style.color = "#ff6b6b";

    submitPost.disabled = false;
    submitPost.textContent = "Post Anonymously";

    return;
}
    // Success
    postMessage.textContent = "Your post was shared anonymously!";

    postMessage.style.color = "#a970ff";

    postContent.value = "";
    characterCount.textContent = "0";

    submitPost.textContent = "Posted!";

    // Wait a moment, then close
    setTimeout(() => {

        postModal.classList.remove("show");

        submitPost.disabled = false;
        submitPost.textContent = "Post Anonymously";

        postMessage.textContent = "";

    }, 1200);

});

let currentCategory = "All";

// =========================
// FETCH POSTS WITH COMMENT COUNTS
// =========================

async function fetchPosts() {
    const { data: posts, error } = await supabaseClient
        .from("Posts")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading posts:", error);
        return null;
    }

    if (!posts || posts.length === 0) {
        return [];
    }

    const postIds = posts
        .map(post => post.id)
        .filter(id => id != null)
        .map(String);

    if (postIds.length === 0) {
        return posts.map(post => ({ ...post, comments_count: 0 }));
    }

    const { data: commentRows, error: commentError } = await supabaseClient
        .from("Comments")
        .select("post_id")
        .in("post_id", postIds);

    if (commentError) {
        console.error("Error loading comment counts:", commentError);
        return posts.map(post => ({ ...post, comments_count: 0 }));
    }

    const commentCounts = commentRows.reduce((acc, row) => {
        const key = String(row.post_id);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    return posts.map(post => ({
        ...post,
        comments_count: commentCounts[String(post.id)] || 0
    }));
}

async function loadPosts() {
    const posts = await fetchPosts();

    if (!posts) return;

    console.log("Posts loaded:", posts);

    displayPosts(posts);
}

// =========================
// DISPLAY POSTS
// =========================

function displayPosts(posts) {

    const container = document.getElementById("posts-container");

    if (!container) return;

    // Filter posts
    let filteredPosts = posts;

    if (currentCategory !== "All") {
        filteredPosts = posts.filter(post =>
            post.category === currentCategory
        );
    }

    // No posts message
    if (filteredPosts.length === 0) {

        container.innerHTML = `
            <div class="no-posts">
                <p>No ${currentCategory.toLowerCase()} yet.</p>
            </div>
        `;

        return;
    }

    // Create post cards
    container.innerHTML = filteredPosts.map(post => `

        <article class="post-card">

            <div class="post-header">

                <div class="post-user">

                    <div class="post-avatar">
                        <img src="../images/logo.png" alt="Anonymous">
                    </div>

                    <div class="post-info">

                        <h3>Anonymous</h3>

                        <div class="post-meta">

                            <span>
                                ${new Date(post.created_at).toLocaleString()}
                            </span>

                            <span>•</span>

                            <span class="post-category">
                                ${post.category || "Confessions"}
                            </span>

                        </div>

                    </div>

                </div>

                <button class="more-btn">
                    <i class="fa-solid fa-ellipsis"></i>
                </button>

            </div>

            <p class="post-text">
                ${post.content || ""}
            </p>

            <div class="post-actions">

                <div class="left-actions">

                    <button class="action-btn like-btn" data-post-id="${post.id}">

                        <i class="fa-regular fa-heart"></i>

                        <span>${post.likes || 0}</span>

                    </button>

                    <button class="action-btn comment-btn" data-post-id="${post.id}">

                        <i class="fa-regular fa-comment"></i>

                        <span>${post.comments_count || 0}</span>

                    </button>

                </div>

                <div class="right-actions">

                    <button class="icon-btn">

                        <i class="fa-regular fa-bookmark"></i>

                    </button>

                    <button class="icon-btn">

                        <i class="fa-solid fa-share"></i>

                    </button>

                </div>

            </div>

        </article>

    `).join("");
}

// =========================
// CATEGORY FILTER
// =========================

const categoryTabs = document.querySelectorAll(".category-tab");

categoryTabs.forEach(tab => {

    tab.addEventListener("click", async () => {

        // Remove active from all tabs
        categoryTabs.forEach(button => {
            button.classList.remove("active");
        });

        // Make clicked tab active
        tab.classList.add("active");

        // Get selected category
        const selectedText = tab.textContent.trim();

        if (selectedText.includes("Confessions")) {
            currentCategory = "Confessions";
        } 
        else if (selectedText.includes("Opinions")) {
            currentCategory = "Opinions";
        } 
        else {
            currentCategory = "All";
        }

        // Get posts again
        const posts = await fetchPosts();

        if (!posts) {
            return;
        }

        displayPosts(posts);

    });

});

loadPosts();

// =========================
// LIKE POSTS
// =========================

document.addEventListener("click", async (event) => {

    const likeButton = event.target.closest(".like-btn");

    if (!likeButton) return;

    const postId = likeButton.dataset.postId;

    if (!postId) return;

    if (likeButton.disabled) return;

    likeButton.disabled = true;

    try {

        const { data: post, error: fetchError } = await supabaseClient
            .from("Posts")
            .select("likes")
            .eq("id", postId)
            .single();

        if (fetchError) {
            console.error("Error getting likes:", fetchError);
            return;
        }

        const newLikes = (post.likes || 0) + 1;

        const { error: updateError } = await supabaseClient
            .from("Posts")
            .update({
                likes: newLikes
            })
            .eq("id", postId);

        if (updateError) {
            console.error("Error updating likes:", updateError);
            return;
        }

        const count = likeButton.querySelector("span");

        if (count) {
            count.textContent = newLikes;
        }

        const heart = likeButton.querySelector("i");

        if (heart) {
            heart.classList.remove("fa-regular");
            heart.classList.add("fa-solid");
        }

    } finally {

        likeButton.disabled = false;

    }

});

// =========================
// SEARCH POSTS
// =========================

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", async () => {

        const searchTerm = searchInput.value.trim().toLowerCase();

        const posts = await fetchPosts();

        if (!posts) {
            return;
        }

        let results = posts;

        if (searchTerm) {
            results = posts.filter(post =>
                (post.content || "").toLowerCase().includes(searchTerm) ||
                (post.category || "").toLowerCase().includes(searchTerm)
            );
        }

        if (currentCategory !== "All") {
            results = results.filter(post =>
                post.category === currentCategory
            );
        }

        displayPosts(results);

    });

}

// =========================
// COMMENTS
// =========================

const commentModal = document.getElementById("commentModal");
const closeCommentModal = document.getElementById("closeCommentModal");
const commentsList = document.getElementById("commentsList");
const commentContent = document.getElementById("commentContent");
const submitComment = document.getElementById("submitComment");
const commentMessage = document.getElementById("commentMessage");

let selectedPostId = null;

// Open comments
if (document) {
    document.addEventListener("click", async (event) => {

        const commentButton = event.target.closest(".comment-btn");

        if (!commentButton) return;

        selectedPostId = commentButton.dataset.postId;

        if (!commentModal) return;

        commentModal.classList.add("show");

        if (commentContent) {
            commentContent.value = "";
        }

        await loadComments(selectedPostId);

    });
}

// Close comments
if (closeCommentModal) {
    closeCommentModal.addEventListener("click", () => {
        if (commentModal) {
            commentModal.classList.remove("show");
        }
    });
}

// Close when clicking outside
if (commentModal) {
    commentModal.addEventListener("click", (event) => {
        if (event.target === commentModal) {
            commentModal.classList.remove("show");
        }
    });
}

// Load comments
async function loadComments(postId) {

    if (!commentsList) return;

    commentsList.innerHTML = "<p>Loading comments...</p>";

    const { data, error } = await supabaseClient
        .from("Comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

    if (error) {

        console.error("Error loading comments:", error);

        commentsList.innerHTML =
            "<p>Unable to load comments.</p>";

        return;
    }

    if (!data || data.length === 0) {

        commentsList.innerHTML =
            "<p>No comments yet. Be the first!</p>";

        return;

    }

    commentsList.innerHTML = data.map(comment => `

        <div class="comment-item">

            <strong>Anonymous</strong>

            <p>${comment.content}</p>

        </div>

    `).join("");
}

// Submit comment
if (submitComment) {
    submitComment.addEventListener("click", async () => {

        if (!commentContent || !commentMessage) return;

        const content = commentContent.value.trim();

        if (!content) {

            commentMessage.textContent =
                "Please write a comment first.";

            commentMessage.style.color = "#ff6b6b";

            return;

        }

        submitComment.disabled = true;

        submitComment.textContent = "Posting...";

        const { error } = await supabaseClient
            .from("Comments")
            .insert([
                {
                    post_id: selectedPostId,
                    content: content
                }
            ]);

        if (error) {

            console.error("Error creating comment:", error);

            commentMessage.textContent =
                error.message;

            commentMessage.style.color = "#ff6b6b";

            submitComment.disabled = false;

            submitComment.textContent =
                "Comment Anonymously";

            return;

        }

        if (commentContent) {
            commentContent.value = "";
        }

        commentMessage.textContent =
            "Comment posted anonymously!";

        commentMessage.style.color =
            "#a970ff";

        // Keep the comment modal up-to-date and refresh the post feed
        await loadComments(selectedPostId);
        await loadPosts();

        submitComment.disabled = false;

        submitComment.textContent =
            "Comment Anonymously";

    });
}

// =========================
// TRENDING POSTS
// =========================

async function loadTrendingPosts() {

    const trendingContainer = document.getElementById("trending-list");

    if (!trendingContainer) return;

    const { data, error } = await supabaseClient
        .from("Posts")
        .select("*")
        .order("likes", { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error loading trending posts:", error);
        return;
    }

    if (!data || data.length === 0) {

        trendingContainer.innerHTML = `
            <p class="no-trending">
                No trending posts yet.
            </p>
        `;

        return;
    }

    trendingContainer.innerHTML = data.map((post, index) => `

        <div class="trending-item">

            <div class="trending-number">
                ${index + 1}
            </div>

            <div class="trending-content">

                <p>
                    ${post.content || ""}
                </p>

                <span>
                    ❤️ ${post.likes || 0} likes
                </span>

            </div>

        </div>

    `).join("");
}

loadTrendingPosts();

// =========================
// SIDEBAR NAV (About / Home toggle)
// =========================

const aboutSection = document.getElementById("about-section");
const postsContainer = document.getElementById("posts-container");
const categoryTabsEl = document.querySelector(".category-tabs");
const sidebarLinks = document.querySelectorAll(".sidebar-link");

sidebarLinks.forEach(link => {
    link.addEventListener("click", function(event) {
        event.preventDefault();

        // Update active class
        sidebarLinks.forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        if (link.id === "aboutLink") {
            // Show About, hide posts and tabs
            if (aboutSection) aboutSection.style.display = "block";
            if (postsContainer) postsContainer.style.display = "none";
            if (categoryTabsEl) categoryTabsEl.style.display = "none";
            console.log("About page opened");
        } else {
            // Show posts and tabs, hide About
            if (aboutSection) aboutSection.style.display = "none";
            if (postsContainer) postsContainer.style.display = "";
            if (categoryTabsEl) categoryTabsEl.style.display = "";
            // Reload posts to ensure content visible
            loadPosts();
        }
    });
});

// =========================
// TOP POSTS
// =========================

const topPostsLink = document.getElementById("topPostsLink");

if (topPostsLink) {

    topPostsLink.addEventListener("click", async function(event) {

        event.preventDefault();

        console.log("Top Posts clicked");

        // Make Top Posts active
        document.querySelectorAll(".sidebar-link").forEach(link => {
            link.classList.remove("active");
        });

        topPostsLink.classList.add("active");

        // Hide About
        if (aboutSection) {
            aboutSection.style.display = "none";
        }

        // Show posts
        if (postsContainer) {
            postsContainer.style.display = "block";
        }

        // Hide category tabs container
        if (typeof categoryTabsEl !== 'undefined' && categoryTabsEl) {
            categoryTabsEl.style.display = "none";
        }

        // Show loading
        if (postsContainer) postsContainer.innerHTML = "<p>Loading top posts...</p>";

        // Get posts from Supabase
        const { data, error } = await supabaseClient
            .from("Posts")
            .select("*")
            .order("likes", { ascending: false });

        if (error) {

            console.error("Error loading top posts:", error);

            if (postsContainer) postsContainer.innerHTML = "<p>Something went wrong loading top posts.</p>";

            return;
        }

        console.log("Top Posts:", data);

        if (!data || data.length === 0) {

            if (postsContainer) postsContainer.innerHTML = "<p>No posts found.</p>";

            return;
        }

        // Display posts (basic render similar to displayPosts)
        if (postsContainer) {
            postsContainer.innerHTML = data.map(post => `

            <article class="post-card">

                <div class="post-header">

                    <div class="post-user">

                        <div class="post-avatar">
                            <img src="../images/logo.png" alt="Anonymous">
                        </div>

                        <div class="post-info">

                            <h3>Anonymous</h3>

                            <div class="post-meta">

                                <span>
                                    ${new Date(post.created_at).toLocaleString()}
                                </span>

                                <span>•</span>

                                <span class="post-category">
                                    ${post.category || ""}
                                </span>

                            </div>

                        </div>

                    </div>

                    <button class="more-btn">
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>

                </div>

                <p class="post-text">
                    ${post.content || ""}
                </p>

                <div class="post-actions">

                    <div class="left-actions">

                        <button class="action-btn like-btn" data-post-id="${post.id}">

                            <i class="fa-regular fa-heart"></i>

                            <span>
                                ${post.likes || 0}
                            </span>

                        </button>

                        <button class="action-btn comment-btn" data-post-id="${post.id}">

                            <i class="fa-regular fa-comment"></i>

                            <span>0</span>

                        </button>

                    </div>

                    <div class="right-actions">

                        <button class="icon-btn">
                            <i class="fa-regular fa-bookmark"></i>
                        </button>

                        <button class="icon-btn">
                            <i class="fa-solid fa-share"></i>
                        </button>

                    </div>

                </div>

            </article>

        `).join("");
        }

    });

}

// =========================
// RECENT POSTS
// =========================

const recentPostsLink = document.getElementById("recentPostsLink");

if (recentPostsLink) {

    recentPostsLink.addEventListener("click", async function(event) {

        event.preventDefault();

        console.log("Recent Posts clicked");

        // Make Recent active
        document.querySelectorAll(".sidebar-link").forEach(link => {
            link.classList.remove("active");
        });

        recentPostsLink.classList.add("active");

        // Hide About
        if (aboutSection) {
            aboutSection.style.display = "none";
        }

        // Show posts
        if (postsContainer) {
            postsContainer.style.display = "block";
        }

        // Hide category tabs container
        if (typeof categoryTabsEl !== 'undefined' && categoryTabsEl) {
            categoryTabsEl.style.display = "none";
        }

        // Loading message
        if (postsContainer) postsContainer.innerHTML = "<p>Loading recent posts...</p>";

        // Get newest posts from Supabase
        const { data, error } = await supabaseClient
            .from("Posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {

            console.error("Error loading recent posts:", error);

            if (postsContainer) postsContainer.innerHTML = "<p>Something went wrong loading recent posts.</p>";

            return;
        }

        console.log("Recent Posts:", data);

        if (!data || data.length === 0) {

            if (postsContainer) postsContainer.innerHTML = "<p>No recent posts found.</p>";

            return;
        }

        // Display recent posts
        if (postsContainer) {
            postsContainer.innerHTML = data.map(post => `

            <article class="post-card">

                <div class="post-header">

                    <div class="post-user">

                        <div class="post-avatar">
                            <img src="../images/logo.png" alt="Anonymous">
                        </div>

                        <div class="post-info">

                            <h3>Anonymous</h3>

                            <div class="post-meta">

                                <span>
                                    ${new Date(post.created_at).toLocaleString()}
                                </span>

                                <span>•</span>

                                <span class="post-category">
                                    ${post.category || ""}
                                </span>

                            </div>

                        </div>

                    </div>

                    <button class="more-btn">
                        <i class="fa-solid fa-ellipsis"></i>
                    </button>

                </div>

                <p class="post-text">
                    ${post.content || ""}
                </p>

                <div class="post-actions">

                    <div class="left-actions">

                        <button class="action-btn like-btn" data-post-id="${post.id}">

                            <i class="fa-regular fa-heart"></i>

                            <span>
                                ${post.likes || 0}
                            </span>

                        </button>

                        <button class="action-btn comment-btn" data-post-id="${post.id}">

                            <i class="fa-regular fa-comment"></i>

                            <span>0</span>

                        </button>

                    </div>

                    <div class="right-actions">

                        <button class="icon-btn">
                            <i class="fa-regular fa-bookmark"></i>
                        </button>

                        <button class="icon-btn">
                            <i class="fa-solid fa-share"></i>
                        </button>

                    </div>

                </div>

            </article>

        `).join("");
        }

    });

}

/* =========================================
   MOBILE SEARCH
   ========================================= */

const searchBox = document.querySelector(".search-box");
const searchIcon = searchBox?.querySelector("i");
const searchInput = document.querySelector("#searchInput");

if (searchIcon && searchBox && searchInput) {

    searchIcon.addEventListener("click", function () {

        searchBox.classList.toggle("active");

        if (searchBox.classList.contains("active")) {
            searchInput.focus();
        }

    });

}
