/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package com.janilla.conduit.backend;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.LongStream;
import java.util.stream.Stream;

import com.janilla.io.IO;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Parameter;
import com.janilla.reflect.Reflection;
import com.janilla.web.ForbiddenException;
import com.janilla.web.Handle;

public class ArticleApi {

	static Pattern nonAlphanumeric = Pattern.compile("[^\\p{Alnum}]+", Pattern.UNICODE_CHARACTER_CLASS);

	static String toSlug(String title) {
		return nonAlphanumeric.splitAsStream(title.toLowerCase()).collect(Collectors.joining("-"));
	}

	Persistence persistence;

	public Persistence getPersistence() {
		return persistence;
	}

	public void setPersistence(Persistence persistence) {
		this.persistence = persistence;
	}

	@Handle(method = "POST", uri = "/api/articles")
	public Object create(Form form, User user) throws IOException {
		var s = toSlug(form.article.title);
		validate(null, s, form.article);
		var a = new Article();
		Reflection.copy(form.article, a);
		a.setSlug(s);
		a.setCreatedAt(Instant.now());
		a.setAuthor(user.getId());
		persistence.getDatabase().performTransaction(() -> persistence.getCrud(Article.class).create(a));
		return Map.of("article", a);
	}

	@Handle(method = "PUT", uri = "/api/articles/([^/]*)")
	public Object update(String slug, Form form, User user) throws IOException {
		var s = toSlug(form.article.title);
		validate(slug, s, form.article);
		var c = persistence.getCrud(Article.class);
		var i = new long[1];
		c.indexAccept("slug", slug, x -> i[0] = x.findFirst().getAsLong());
		var a = new Article[1];
		persistence.getDatabase().performTransaction(() -> a[0] = c.update(i[0], x -> {
			Reflection.copy(form.article, x);
			x.setSlug(s);
			x.setUpdatedAt(Instant.now());
		}));
		return Map.of("article", a[0]);
	}

	@Handle(method = "DELETE", uri = "/api/articles/([^/]*)")
	public void delete(String slug) throws IOException {
		var c = persistence.getCrud(Article.class);
		var i = new long[1];
		c.indexAccept("slug", slug, x -> i[0] = x.findFirst().getAsLong());
		persistence.getDatabase().performTransaction(() -> c.delete(i[0]));
	}

	@Handle(method = "GET", uri = "/api/articles/([^/]*)")
	public Object get(String slug) throws IOException {
		var c = persistence.getCrud(Article.class);
		var i = new long[1];
		c.indexAccept("slug", slug, x -> i[0] = x.findFirst().getAsLong());
		var a = c.read(i[0]);
		return Collections.singletonMap("article", a);
	}

	@Handle(method = "GET", uri = "/api/articles")
	public Object list(@Parameter("tag") String tag, @Parameter("author") String author,
			@Parameter("favorited") String favorited, @Parameter("skip") long skip, @Parameter("limit") long limit)
			throws IOException {
		class A {

			Object[] l;

			long c;
		}
		var a = new A();
		{
			var c = persistence.getCrud(User.class);
			var d = persistence.getDatabase();
			if (tag != null && !tag.isBlank())
				d.performOnIndex("Article.tagList", i -> {
					a.l = i.list(tag).skip(skip).limit(limit).toArray();
					a.c = i.count(tag);
				});
			else if (author != null && !author.isBlank()) {
				var i = new long[1];
				c.indexAccept("username", author, x -> i[0] = x.findFirst().getAsLong());
				d.performOnIndex("Article.author", j -> {
					a.l = j.list(i[0]).skip(skip).limit(limit).toArray();
					a.c = j.count(i[0]);
				});
			} else if (favorited != null && !favorited.isBlank()) {
				var i = new long[1];
				c.indexAccept("username", favorited, x -> i[0] = x.findFirst().getAsLong());
				d.performOnIndex("User.favoriteList", j -> {
					a.l = j.list(i[0]).skip(skip).limit(limit).toArray();
					a.c = j.count(i[0]);
				});
			} else
				d.performOnIndex("Article", i -> {
					a.l = i.list(null).skip(skip).limit(limit).toArray();
					a.c = i.count(null);
				});
		}

		var c = persistence.getCrud(Article.class);
		return Map.of("articles", Arrays.stream(a.l).map(x -> {
			try {
				return c.read((Long) ((Object[]) x)[1]);
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}
		}), "articlesCount", a.c);
	}

	@Handle(method = "GET", uri = "/api/articles/feed")
	public Object listFeed(@Parameter("skip") long skip, @Parameter("limit") long limit, User user) throws IOException {
		class A {

			Iterator<Object> l;

			Object o;

			long c;
		}
		var l = new ArrayList<A>();
		var f = LongStream.builder();
		persistence.getCrud(User.class).indexAccept("followList", user.getId(), x -> x.forEach(f::add));
		persistence.getDatabase().performOnIndex("Article.author", x -> {
			for (var y : f.build().toArray()) {
				var a = new A();
				a.l = x.list(y).iterator();
				a.o = a.l.hasNext() ? a.l.next() : null;
				a.c = x.count(y);
				l.add(a);
			}
		});
		IO.Supplier<Article> s = () -> {
			var a = l.stream().max((a1, a2) -> {
				var i1 = a1.o != null ? (Instant) ((Object[]) a1.o)[0] : null;
				var i2 = a2.o != null ? (Instant) ((Object[]) a2.o)[0] : null;
				return i1 != null ? (i2 != null ? i1.compareTo(i2) : 1) : (i2 != null ? -1 : 0);
			}).orElse(null);
			if (a == null || a.o == null)
				return null;
			var b = persistence.getCrud(Article.class).read((Long) ((Object[]) a.o)[1]);
			a.o = a.l.hasNext() ? a.l.next() : null;
			return b;
		};
		return Map.of("articles", Stream.iterate(s.get(), x -> {
			try {
				return s.get();
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}
		}).skip(skip).limit(limit).filter(Objects::nonNull), "articlesCount", l.stream().mapToLong(a -> a.c).sum());
	}

	@Handle(method = "POST", uri = "/api/articles/([^/]*)/comments")
	public Object createComment(String slug, CommentForm form, User user) throws IOException {
		var v = new Validation();
		if (v.isNotBlank("body", form.comment.body))
			v.isSafe("body", form.comment.body);
		v.orThrow();
		var z = persistence.getCrud(Article.class);
		var i = new long[1];
		z.indexAccept("slug", slug, x -> i[0] = x.findFirst().getAsLong());
		var a = z.read(i[0]);
		var c = new Comment();
		Reflection.copy(form.comment, c);
		c.setCreatedAt(Instant.now());
		c.setAuthor(user.getId());
		c.setArticle(a.getId());
		persistence.getDatabase().performTransaction(() -> persistence.getCrud(Comment.class).create(c));
		return Map.of("comment", c);
	}

	@Handle(method = "DELETE", uri = "/api/articles/([^/]*)/comments/([^/]*)")
	public void deleteComment(String slug, Long id, User user) throws IOException {
		var c = persistence.getCrud(Comment.class);
		var d = c.read(id);
		if (d.getAuthor().equals(user.getId()))
			persistence.getDatabase().performTransaction(() -> c.delete(id));
		else
			throw new ForbiddenException();
	}

	@Handle(method = "GET", uri = "/api/articles/([^/]*)/comments")
	public Object listComments(String slug) throws IOException {
		var i = new long[1];
		persistence.getCrud(Article.class).indexAccept("slug", slug, x -> i[0] = x.findFirst().getAsLong());
		var c = persistence.getCrud(Comment.class);
		var j = Stream.<Long>builder();
		c.indexAccept("article", i[0], x -> x.forEach(j::add));
		return Map.of("comments", j.build().map(x -> {
			try {
				return c.read(x);
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}
		}));
	}

	@Handle(method = "POST", uri = "/api/articles/([^/]*)/favorite")
	public Object favorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = persistence.getCrud(Article.class);
		var d = persistence.getDatabase();
		var i = new long[1];
		c.indexAccept("slug", slug, x -> i[0] = x.findFirst().getAsLong());
		var a = c.read(i[0]);
		persistence.getDatabase().performTransaction(() -> {
			d.performOnIndex("Article.favoriteList", j -> {
				if (!j.add(i[0], user.getId()))
					throw new RuntimeException();
			});
			d.performOnIndex("User.favoriteList", j -> j.add(user.getId(), new Object[] { a.getCreatedAt(), i[0] }));
		});
		return Map.of("article", i[0]);
	}

	@Handle(method = "DELETE", uri = "/api/articles/([^/]*)/favorite")
	public Object unfavorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = persistence.getCrud(Article.class);
		var d = persistence.getDatabase();
		var i = new long[1];
		c.indexAccept("slug", slug, x -> i[0] = x.findFirst().getAsLong());
		var a = c.read(i[0]);
		persistence.getDatabase().performTransaction(() -> {
			d.performOnIndex("Article.favoriteList", j -> {
				if (!j.remove(i[0], user.getId()))
					throw new RuntimeException();
			});
			d.performOnIndex("User.favoriteList", j -> j.remove(user.getId(), new Object[] { a.getCreatedAt(), i[0] }));
		});
		return Map.of("article", i[0]);
	}

	protected void validate(String slug1, String slug2, Form.Article article) throws IOException {
		var v = new Validation();
		var c = persistence.getCrud(Article.class);
		if (v.isNotBlank("title", article.title) && v.isNotTooLong("title", article.title, 100)
				&& v.isSafe("title", article.title)) {
			var i = Stream.<Long>builder();
			c.indexAccept("slug", slug2, x -> x.forEach(i::add));
			var a = i.build().map(x -> {
				try {
					return c.read(x);
				} catch (IOException e) {
					throw new UncheckedIOException(e);
				}
			}).filter(x -> !x.getSlug().equals(slug1)).findFirst().orElse(null);
			v.isUnique("title", a);
		}
		if (v.isNotBlank("description", article.description) && v.isNotTooLong("description", article.description, 200)
				&& v.isSafe("description", article.description))
			;
		if (v.isNotBlank("body", article.body) && v.isNotTooLong("body", article.body, 2000)
				&& v.isSafe("body", article.body))
			;
		var t = article.tagList != null ? article.tagList.stream().collect(Collectors.joining(" ")) : null;
		if (v.isNotTooLong("tagList", t, 100) && v.isSafe("tagList", t))
			;
		v.orThrow();
	}

	public record Form(@Parameter("article") Article article) {

		public record Article(@Parameter("title") String title, @Parameter("description") String description,
				@Parameter("body") String body, @Parameter("tagList") Collection<String> tagList) {
		}
	}

	public record CommentForm(@Parameter("comment") Comment comment) {

		public record Comment(@Parameter("body") String body) {
		}
	}
}
