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
import java.util.Properties;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.janilla.persistence.Crud;
import com.janilla.persistence.Persistence;
import com.janilla.reflect.Reflection;
import com.janilla.web.ForbiddenException;
import com.janilla.web.Handle;

public class ArticleApi {

	public Properties configuration;

	public Persistence persistence;

	@Handle(method = "POST", path = "/api/articles")
	public Object create(Form form, User user) throws IOException {
		var s = toSlug(form.article.title);
		validate(null, s, form.article);

		if (Boolean.parseBoolean(configuration.getProperty("conduit.live-demo"))) {
			var c = persistence.crud(Article.class).count();
			if (c >= 1000)
				throw new ValidationException("existing articles", "are too many (" + c + ")");
		}

		var n = Instant.now();
		var a = new Article(null, s, null, null, null,
				form.article.tagList() != null ? form.article.tagList().stream().sorted().toList()
						: Collections.emptyList(),
				n, n, user.id());
		a = Reflection.copy(form.article, a, x -> !x.equals("id") && !x.equals("slug") && !x.equals("tagList")
				&& !x.equals("createdAt") && !x.equals("updatedAt") && !x.equals("author"));
		a = persistence.crud(Article.class).create(a);

		return Map.of("article", a);
	}

	@Handle(method = "GET", path = "/api/articles/([^/]*)")
	public Object read(String slug) throws IOException {
		var c = persistence.crud(Article.class);
		var i = c.find("slug", slug);
		var a = i > 0 ? c.read(i) : null;
		return Collections.singletonMap("article", a);
	}

	@Handle(method = "PUT", path = "/api/articles/([^/]*)")
	public Object update(String slug, Form form, User user) throws IOException {
		var s = form.article.title != null ? toSlug(form.article.title) : slug;
		validate(slug, s, form.article);

		var c = persistence.crud(Article.class);
		var i = c.find("slug", slug);
		var a = i > 0 ? c.update(i, x -> {
			x = new Article(x.id(), s, null, null, null,
					form.article.tagList() != null ? form.article.tagList().stream().sorted().toList()
							: Collections.emptyList(),
					x.createdAt(), Instant.now(), x.author());
			return Reflection.copy(form.article, x, y -> !y.equals("slug") && !y.equals("tagList")
					&& !y.equals("createdAt") && !y.equals("updatedAt") && !y.equals("author"));
		}) : null;

		return Collections.singletonMap("article", a);
	}

	@Handle(method = "DELETE", path = "/api/articles/([^/]*)")
	public void delete(String slug) throws IOException {
		var c = persistence.crud(Article.class);
		var i = c.find("slug", slug);
		if (i > 0)
			c.delete(i);
	}

	@Handle(method = "GET", path = "/api/articles")
	public Object list(Filter filter, Range range) throws IOException {
		var t = filter != null && filter.tag != null && !filter.tag.isBlank() ? new Object[] { filter.tag }
				: new Object[0];
		var a = filter != null && filter.author != null && !filter.author.isBlank()
				? new Object[] { persistence.crud(User.class).find("username", filter.author) }
				: new Object[0];
		var f = filter != null && filter.favorited != null && !filter.favorited.isBlank()
				? new Object[] { persistence.crud(User.class).find("username", filter.favorited) }
				: new Object[0];
		var p = persistence.crud(Article.class).filter(Map.of("tagList", t, "author", a, "favoriteList", f),
				range != null ? range.skip : 0, range != null ? range.limit : -1);
		return Map.of("articles", persistence.crud(Article.class).read(p.ids()), "articlesCount", p.total());
	}

	@Handle(method = "GET", path = "/api/articles/feed")
	public Object listFeed(Range range, User user) throws IOException {
		var u = persistence.crud(User.class).filter("followList", user.id());
		var p = u.length > 0 ? persistence.crud(Article.class).filter("author", range.skip, range.limit,
				Arrays.stream(u).boxed().toArray()) : Crud.Page.empty();
		return Map.of("articles", persistence.crud(Article.class).read(p.ids()), "articlesCount", p.total());
	}

	@Handle(method = "POST", path = "/api/articles/([^/]*)/comments")
	public Object createComment(String slug, CommentForm form, User user) throws IOException {
		var v = new Validation();
		v.configuration = configuration;
		if (v.isNotBlank("body", form.comment.body))
			v.isSafe("body", form.comment.body);
		v.orThrow();

		if (Boolean.parseBoolean(configuration.getProperty("conduit.live-demo"))) {
			var c = persistence.crud(Comment.class).count();
			if (c >= 1000)
				throw new ValidationException("existing comments", "are too many (" + c + ")");
		}

		var a = persistence.crud(Article.class).find("slug", slug);
		if (a <= 0)
			throw new RuntimeException();

		var n = Instant.now();
		var c = new Comment(null, n, n, null, user.id(), a);
		c = Reflection.copy(form.comment, c, x -> x.equals("body"));
		c = persistence.crud(Comment.class).create(c);

		return Map.of("comment", c);
	}

	@Handle(method = "DELETE", path = "/api/articles/([^/]*)/comments/([^/]*)")
	public void deleteComment(String slug, Long id, User user) throws IOException {
		var c = persistence.crud(Comment.class);
		var d = c.read(id);
		if (d.author().equals(user.id()))
			c.delete(id);
		else
			throw new ForbiddenException();
	}

	@Handle(method = "GET", path = "/api/articles/([^/]*)/comments")
	public Object listComments(String slug) throws IOException {
		var i = persistence.crud(Article.class).find("slug", slug);
		var c = persistence.crud(Comment.class);
		var j = c.filter("article", i);
		return Map.of("comments", c.read(j));
	}

	@Handle(method = "POST", path = "/api/articles/([^/]*)/favorite")
	public Object favorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = (ArticleCrud) persistence.crud(Article.class);
		var i = c.find("slug", slug);
		var a = i > 0 ? c.read(i) : null;
		c.favorite(a.id(), a.createdAt(), user.id());
		return Map.of("article", i);
	}

	@Handle(method = "DELETE", path = "/api/articles/([^/]*)/favorite")
	public Object unfavorite(String slug, User user) throws IOException {
		if (user == null)
			throw new NullPointerException("user=" + user);
		var c = (ArticleCrud) persistence.crud(Article.class);
		var i = c.find("slug", slug);
		var a = i > 0 ? c.read(i) : null;
		c.unfavorite(a.id(), a.createdAt(), user.id());
		return Map.of("article", i);
	}

	static Pattern nonAlphanumeric = Pattern.compile("[^\\p{Alnum}]+", Pattern.UNICODE_CHARACTER_CLASS);

	protected String toSlug(String title) {
		return nonAlphanumeric.splitAsStream(title.toLowerCase()).collect(Collectors.joining("-"));
	}

	protected void validate(String slug1, String slug2, Form.Article article) throws IOException {
		var v = new Validation();
		v.configuration = configuration;
		var c = persistence.crud(Article.class);
		if ((slug2.equals(slug1) && article.title == null) || (v.isNotBlank("title", article.title)
				&& v.isNotTooLong("title", article.title, 100) && v.isSafe("title", article.title))) {
			var i = c.filter("slug", slug2);
			var a = c.read(i).filter(x -> !x.slug().equals(slug1)).findFirst().orElse(null);
			v.isUnique("title", a);
		}
		if ((slug2.equals(slug1) && article.description == null) || (v.isNotBlank("description", article.description)
				&& v.isNotTooLong("description", article.description, 200)
				&& v.isSafe("description", article.description)))
			;
		if (v.isNotBlank("body", article.body) && v.isNotTooLong("body", article.body, 2000)
				&& v.isSafe("body", article.body))
			;
		var t = article.tagList != null ? article.tagList.stream().collect(Collectors.joining(" ")) : null;
		if (v.isNotTooLong("tagList", t, 100) && v.isSafe("tagList", t))
			;
		v.orThrow();
	}

	public record Filter(String tag, String author, String favorited) {
	}

	public record Range(long skip, long limit) {
	}

	public record Form(Article article) {

		public record Article(String title, String description, String body, Collection<String> tagList) {
		}
	}

	public record CommentForm(Comment comment) {

		public record Comment(String body) {
		}
	}
}
