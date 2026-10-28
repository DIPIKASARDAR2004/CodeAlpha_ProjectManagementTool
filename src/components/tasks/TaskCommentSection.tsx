"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Send, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export interface CommentItem {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface TaskCommentSectionProps {
  taskId: string;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export function TaskCommentSection({ taskId }: TaskCommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchComments = useCallback(async () => {
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("comments")
        .select(
          `
          id,
          task_id,
          user_id,
          content,
          created_at,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setComments((data as unknown as CommentItem[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load comments";
      console.error("Error fetching comments:", msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed || !user || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    // Optimistic comment item
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: CommentItem = {
      id: tempId,
      task_id: taskId,
      user_id: user.id,
      content: trimmed,
      created_at: new Date().toISOString(),
      profiles: {
        id: user.id,
        full_name: profile?.full_name || user.email?.split("@")[0] || "You",
        email: user.email || null,
        avatar_url: profile?.avatar_url || null,
      },
    };

    setComments((prev) => [...prev, optimisticComment]);
    setNewComment("");
    setTimeout(scrollToBottom, 50);

    try {
      const { data, error: insertError } = await supabase
        .from("comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          content: trimmed,
        })
        .select(
          `
          id,
          task_id,
          user_id,
          content,
          created_at,
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `
        )
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (data) {
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? (data as unknown as CommentItem) : c))
        );
      }
    } catch (err: unknown) {
      // Rollback on error
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setNewComment(trimmed);
      const msg = err instanceof Error ? err.message : "Failed to post comment";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const prevComments = [...comments];
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const { error: delError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (delError) {
        throw new Error(delError.message);
      }
    } catch (err: unknown) {
      setComments(prevComments);
      const msg = err instanceof Error ? err.message : "Failed to delete comment";
      setError(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handlePostComment();
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span>Activity & Comments</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {comments.length}
          </span>
        </h3>
        <span className="text-[11px] text-slate-400">Ctrl + Enter to send</span>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-2 py-4">
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-xs text-slate-500 font-medium">
              No comments yet. Start the team discussion below!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const authorName =
              comment.profiles?.full_name ||
              comment.profiles?.email?.split("@")[0] ||
              "Team Member";
            const isAuthor = user?.id === comment.user_id;
            const initials =
              authorName
                .split(" ")
                .map((n: string) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase() || "U";

            return (
              <div
                key={comment.id}
                className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-slate-50 hover:border-slate-200 transition-colors"
              >
                {/* Author Avatar Initial */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-2xs select-none">
                  {initials}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {authorName}
                      {isAuthor && (
                        <span className="ml-1.5 text-[10px] text-blue-600 font-medium">
                          (You)
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                    {comment.content}
                  </p>
                </div>

                {/* Delete Comment Button (author only) */}
                {isAuthor && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition-opacity"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Add New Comment Box */}
      <form onSubmit={handlePostComment} className="flex flex-col gap-2 pt-2">
        <textarea
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Leave an update or feedback on this task..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
        />

        <div className="flex items-center justify-end gap-2">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={!newComment.trim() || isSubmitting}
            className="text-xs h-8 px-3.5"
          >
            <Send className="h-3 w-3 mr-1.5" />
            <span>Post Comment</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

