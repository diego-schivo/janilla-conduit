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
import java.time.Instant;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import com.janilla.persistence.Crud.Page;
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

		var c = persistence.getCrud(Article.class);
		persistence.getDatabase().performTransaction(() -> c.create(a));

		return Map.of("article", a);
	}

	@Handle(method = "PUT", uri = "/api/articles/([^/]*)")
	public Object update(String slug, Form form, User user) throws IOException {
		var s = toSlug(form.article.title);
		validate(slug, s, form.article);

		var c = persistence.getCrud(Article.class);
		var i = c.find("slug", slug);
		var a = i >= 0 ? persistence.getDatabase().performTransaction(() -> c.update(i, x -> {
			Reflection.copy(form.article, x);
			x.setSlug(s);
			x.setUpdatedAt(Instant.now());
		})) : null;

		return Collections.singletonMap("article", a);
	}

	@Handle(method = "DELETE", uri = "/api/articles/([^/]*)")
	public void delete(String slug) throws IOException {
		var c = persistence.getCrud(Article.class);
		var i = c.find("slug", slug);
		if (i >= 0)
			persistence.getDatabase().performTransaction(() -> c.delete(i));
	}

	@Handle(method = "GET", uri = "/api/articles/([^/]*)")
	public Object get(String slug) throws IOException {
		var c = persistence.getCrud(Article.class);
		var i = c.find("slug", slug);
		var a = i >= 0 ? c.read(i) : null;
		return Collections.singletonMap("article", a);
	}

	@Handle(method = "GET", uri = "/api/articles")
	public Object list(@Parameter("tag") String tag, @Parameter("author") String author,
			@Parameter("favorited") String favorited, @Parameter("skip") long skip, @Parameter("limit") long limit)
			throws IOException {
		class A {

			Object[] o;

			long c;
		}
		var a = new A();
		{
			var c = persistence.getCrud(User.class);
			var d = persistence.getDatabase();
			if (tag != null && !tag.isBlank())
				d.performOnIndex("Article.tagList", x -> {
					a.o = x.list(tag).skip(skip).limit(limit).toArray();
					a.c = x.count(tag);
				});
			else if (author != null && !author.isBlank()) {
				var u = c.find("username", author);
				if (u >= 0)
					d.performOnIndex("Article.author", x -> {
						a.o = x.list(u).skip(skip).limit(limit).toArray();
						a.c = x.count(u);
					});
			} else if (favorited != null && !favorited.isBlank()) {
				var u = c.find("username", favorited);
				if (u >= 0)
					d.performOnIndex("User.favoriteList", x -> {
						a.o = x.list(u).skip(skip).limit(limit).toArray();
						a.c = x.count(u);
					});
			} else
				d.performOnIndex("Article", x -> {
					a.o = x.list(null).skip(skip).limit(limit).toArray();
					a.c = x.count(null);
				});
		}

		var c = persistence.getCrud(Article.class);
		var i = Arrays.stream(a.o).mapToLong(x -> (Long) ((Object[]) x)[1]).toArray();
		var r = c.read(i);

		return Map.of("articles", r, "articlesCount", a.c);
	}

	@Handle(method = "GET", uri = "/api/articles/feed")
	public Object listFeed(@Parameter("skip") long skip, @Parameter("limit") long limit, User user) throws IOException {
		var u = persistence.getCrud(User.class).performOnIndex("followList", user.getId(), LongStream::toArray);
		var c = persistence.getCrud(Article.class);
		var i = u.length > 0 ? Arrays.stream(u).boxed().toArray() : null;
		var p = i != null ? c.filter("author", skip, limit, i) : Page.empty();
		return Map.of("articles", c.read(p.ids()), "articlesCount", p.total());
	}

	@Handle(method = "POST", uri = "/api/articles/([^/]*)/comments")
	public Object createComment(String slug, CommentForm form, User user) throws IOException {
		var v = new Validation();
		if (v.isNotBlank("body", form.comment.body))
			v.isSafe("body", form.comment.body);
		v.orThrow();

		var a = persistence.getCrud(Article.class).find("slug", slug);
		if (a < 0)
			throw new RuntimeException();

		var c = new Comment();
		Reflection.copy(form.comment, c);
		c.setCreatedAt(Instant.now());
		c.setAuthor(user.getId());
		c.setArticle(a);

		var d = persistence.getCrud(Comment.class);
		persistence.getDatabase().performTransaction(() -> d.create(c));

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
		var i = persistence.getCrud(Article.class).performOnIndex("slug", slug, x -> (Long) x.findFirst().orElse(-1));
		var c = persistence.getCrud(Comment.class);
		var j = c.performOnIndex("article", i, LongStream::toArray);
		return Map.of("comments", c.read(j));
	}

	@Handle(method = "POST", uri = "/api/articles/([^/]*)/favorite")
	public Object favorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = persistence.getCrud(Article.class);
		var i = c.find("slug", slug);
		if (i < 0)
			throw new RuntimeException();
		var a = c.read(i);

		var d = persistence.getDatabase();
		d.performTransaction(() -> {
			d.performOnIndex("Article.favoriteList", x -> {
				if (!x.add(i, user.getId()))
					throw new RuntimeException();
			});
			d.performOnIndex("User.favoriteList", x -> {
				x.add(user.getId(), new Object[] { a.getCreatedAt(), i });
			});
		});

		return Map.of("article", i);
	}

	@Handle(method = "DELETE", uri = "/api/articles/([^/]*)/favorite")
	public Object unfavorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = persistence.getCrud(Article.class);
		var i = c.find("slug", slug);
		if (i < 0)
			throw new RuntimeException();
		var a = c.read(i);

		var d = persistence.getDatabase();
		d.performTransaction(() -> {
			d.performOnIndex("Article.favoriteList", x -> {
				if (!x.remove(i, user.getId()))
					throw new RuntimeException();
			});
			d.performOnIndex("User.favoriteList", x -> {
				x.remove(user.getId(), new Object[] { a.getCreatedAt(), i });
			});
		});

		return Map.of("article", i);
	}

	protected void validate(String slug1, String slug2, Form.Article article) throws IOException {
		var v = new Validation();
		var c = persistence.getCrud(Article.class);
		if (v.isNotBlank("title", article.title) && v.isNotTooLong("title", article.title, 100)
				&& v.isSafe("title", article.title)) {
			var i = c.performOnIndex("slug", slug2, LongStream::toArray);
			var a = c.read(i).filter(x -> !x.getSlug().equals(slug1)).findFirst().orElse(null);
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
