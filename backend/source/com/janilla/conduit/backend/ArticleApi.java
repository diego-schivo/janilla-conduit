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
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.janilla.persistence.Persistence;
import com.janilla.reflect.Parameter;
import com.janilla.reflect.Reflection;
import com.janilla.web.ForbiddenException;
import com.janilla.web.Handler;

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

	@Handler(value = "/api/articles", method = "POST")
	public Object create(Form form, User user) throws IOException {
		var s = toSlug(form.article.title);
		validate(null, s, form.article);
		var a = new Article();
		Reflection.copy(form.article, a);
		a.setSlug(s);
		a.setCreatedAt(Instant.now());
		a.setAuthor(user.getId());
		persistence.getCrud(Article.class).create(a);
		return Map.of("article", a);
	}

	@Handler(value = "/api/articles/([^/]*)", method = "PUT")
	public Object update(String slug, Form form, User user) throws IOException {
		var s = toSlug(form.article.title);
		validate(slug, s, form.article);
		var c = persistence.getCrud(Article.class);
		var a = c.indexApply("slug", slug, i -> c.update(i, x -> {
			Reflection.copy(form.article, x);
			x.setSlug(s);
			x.setUpdatedAt(Instant.now());
		})).findFirst().orElse(null);
		return Map.of("article", a);
	}

	@Handler(value = "/api/articles/([^/]*)", method = "DELETE")
	public void delete(String slug) throws IOException {
		var c = persistence.getCrud(Article.class);
		c.indexApply("slug", slug, i -> c.delete(i)).findFirst().orElse(null);
	}

	@Handler(value = "/api/articles/([^/]*)", method = "GET")
	public Object get(String slug) throws IOException {
		var c = persistence.getCrud(Article.class);
		var a = c.indexApply("slug", slug, c::read).findFirst().orElseThrow();
		return Collections.singletonMap("article", a);
	}

	@Handler(value = "/api/articles", method = "GET")
	public Object list(@Parameter("tag") String tag, @Parameter("author") String author,
			@Parameter("favorited") String favorited, @Parameter("skip") long skip, @Parameter("limit") long limit)
			throws IOException {
		var c = persistence.getCrud(User.class);
		var d = persistence.getDatabase();
		class A {

			Stream<Object> l;

			long c;
		}
		var a = new A();
		if (tag != null && !tag.isBlank())
			d.indexAccept("Article.tagList", i -> {
				a.l = i.list(tag);
				a.c = i.count(tag);
			});
		else if (author != null && !author.isBlank())
			c.indexAccept("username", author, i -> d.indexAccept("Article.author", j -> {
				a.l = j.list(i);
				a.c = j.count(i);
			}));
		else if (favorited != null && !favorited.isBlank())
			c.indexAccept("username", favorited, i -> d.indexAccept("User.favoriteList", j -> {
				a.l = j.list(i);
				a.c = j.count(i);
			}));
		else
			d.indexAccept("Article", i -> {
				a.l = i.list(null);
				a.c = i.count(null);
			});
		return Map.of("articles", a.l.map(x -> {
			try {
				return persistence.getCrud(Article.class).read((Long) ((Object[]) x)[1]);
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}
		}).skip(skip).limit(limit), "articlesCount", a.c);
	}

	@Handler(value = "/api/articles/([^/]*)/comments", method = "POST")
	public Object createComment(String slug, CommentForm form, User user) throws IOException {
		var v = new Validation();
		if (v.isNotBlank("body", form.comment.body))
			v.isSafe("body", form.comment.body);
		v.orThrow();
		var z = persistence.getCrud(Article.class);
		var a = z.indexApply("slug", slug, z::read).findFirst().orElseThrow();
		var c = new Comment();
		Reflection.copy(form.comment, c);
		c.setCreatedAt(Instant.now());
		c.setAuthor(user.getId());
		c.setArticle(a.getId());
		persistence.getCrud(Comment.class).create(c);
		return Map.of("comment", c);
	}

	@Handler(value = "/api/articles/([^/]*)/comments/([^/]*)", method = "DELETE")
	public void deleteComment(String slug, Long id, User user) throws IOException {
		var c = persistence.getCrud(Comment.class);
		var d = c.read(id);
		if (d.getAuthor().equals(user.getId()))
			c.delete(id);
		else
			throw new ForbiddenException();
	}

	@Handler(value = "/api/articles/([^/]*)/comments", method = "GET")
	public Object listComments(String slug) throws IOException {
		var c = persistence.getCrud(Comment.class);
		var d = persistence.getCrud(Article.class).indexApply("slug", slug, i -> i).findFirst().map(i -> {
			try {
				return c.indexApply("article", i, c::read);
			} catch (IOException e) {
				throw new UncheckedIOException(e);
			}
		}).orElse(null);
		return Map.of("comments", d);
	}

	@Handler(value = "/api/articles/([^/]*)/favorite", method = "POST")
	public Object favorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = persistence.getCrud(Article.class);
		var d = persistence.getDatabase();
		var a = c.indexApply("slug", slug, i -> {
			d.indexAccept("Article.favoriteList", j -> {
				if (!j.add(i, user.getId()))
					throw new RuntimeException();
			});
			var b = c.read(i);
			d.indexAccept("User.favoriteList", j -> j.add(user.getId(), new Object[] { b.getCreatedAt(), i }));
			return i;
		}).findFirst().orElseThrow();
		return Map.of("article", a);
	}

	@Handler(value = "/api/articles/([^/]*)/favorite", method = "DELETE")
	public Object unfavorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = persistence.getCrud(Article.class);
		var d = persistence.getDatabase();
		var a = c.indexApply("slug", slug, i -> {
			d.indexAccept("Article.favoriteList", j -> {
				if (!j.remove(i, user.getId()))
					throw new RuntimeException();
			});
			var b = c.read(i);
			d.indexAccept("User.favoriteList", j -> j.remove(user.getId(), new Object[] { b.getCreatedAt(), i }));
			return i;
		}).findFirst().orElseThrow();
		return Map.of("article", a);
	}

	protected void validate(String slug1, String slug2, Form.Article article) throws IOException {
		var v = new Validation();
		var c = persistence.getCrud(Article.class);
		if (v.isNotBlank("title", article.title) && v.isNotTooLong("title", article.title, 100)
				&& v.isSafe("title", article.title) && v.isUnique("title", c.indexApply("slug", slug2, c::read)
						.filter(a -> !a.getSlug().equals(slug1)).findFirst().orElse(null)))
			;
		if (v.isNotBlank("description", article.description) && v.isNotTooLong("description", article.description, 200)
				&& v.isSafe("description", article.description))
			;
		if (v.isNotBlank("body", article.body) && v.isNotTooLong("body", article.body, 2000)
				&& v.isSafe("body", article.body)
				)
			;
		var t = article.tagList.stream().collect(Collectors.joining(" "));
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
