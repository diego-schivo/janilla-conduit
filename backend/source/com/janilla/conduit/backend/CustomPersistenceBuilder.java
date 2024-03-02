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
import java.nio.file.Files;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.janilla.persistence.ApplicationPersistenceBuilder;
import com.janilla.persistence.Persistence;
import com.janilla.util.Randomize;
import com.janilla.util.Util;

class CustomPersistenceBuilder extends ApplicationPersistenceBuilder {

	@Override
	public Persistence build() throws IOException {
		var e = Files.exists(file);
		var p = super.build();
		if (!e)
			populate(p);
		return p;
	}

	static List<String> w = new ArrayList<>(Validation.safeWords);

	void populate(Persistence p) throws IOException {
		if (p.getCrud(Article.class).count() > 0)
			return;
		var r = ThreadLocalRandom.current();
		var tags = Randomize.elements(5, 15, w).distinct().toList();
		for (var i = r.nextInt(6, 11); i > 0; i--) {
			var u = new User();
			var n = Randomize.phrase(2, 2, () -> Util.capitalizeFirstChar(Randomize.element(w)));
			u.setUsername(n);
			u.setEmail(n.toLowerCase().replace(' ', '.') + "@conduit.com");
			UserApi.setHashAndSalt(u, n.toLowerCase().substring(0, n.indexOf(' ')));
			u.setImage(
					"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><text x='2' y='12.5' font-size='12'>"
							+ new String(Character.toChars(0x1F600 + r.nextInt(0x50))) + "</text></svg>");
			p.getCrud(User.class).create(u);
			for (var j = r.nextInt(0, 5); j > 0; j--) {
				var a = new Article();
				a.setAuthor(u.getId());
				a.setTitle(Util.capitalizeFirstChar(Randomize.phrase(2, 6, () -> Randomize.element(w))));
				a.setSlug(a.getTitle().toLowerCase().replace(' ', '-'));
				a.setDescription(Randomize.sentence(3, 10, () -> Randomize.element(w)));
				a.setBody(nextBody());
				a.setTagList(Randomize.elements(1, 5, tags).distinct().toList());
				a.setCreatedAt(Randomize.instant(OffsetDateTime.of(2020, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC).toInstant(),
						OffsetDateTime.now(ZoneOffset.UTC).toInstant()));
				p.getCrud(Article.class).create(a);
			}
		}
		for (var i = r.nextInt(20, 31); i > 0; i--) {
			var u = p.getCrud(User.class).read(1 + r.nextLong(p.getCrud(User.class).count()));
			var a = p.getCrud(Article.class).read(1 + r.nextLong(p.getCrud(Article.class).count()));
			var j = r.nextInt(1, 8);
			if ((j & 1) != 0) {
				var c = new Comment();
				c.setCreatedAt(Randomize.instant(a.getCreatedAt(), OffsetDateTime.now(ZoneOffset.UTC).toInstant()));
				c.setBody(Randomize.sentence(3, 10, () -> Randomize.element(w)));
				c.setAuthor(u.getId());
				c.setArticle(a.getId());
				p.getCrud(Comment.class).create(c);
			}
			if ((j & 2) != 0)
				((ArticleCrud) p.getCrud(Article.class)).favorite(a.getId(), a.getCreatedAt(), u.getId());
			if ((j & 4) != 0)
				((UserCrud) p.getCrud(User.class)).follow(a.getAuthor(), u.getId());
		}
	}

	static String nextBody() {
		var r = ThreadLocalRandom.current();
		var b = Stream.<String>builder();
		if (r.nextBoolean())
			b.add("# " + Util.capitalizeFirstChar(Randomize.phrase(3, 7, () -> Randomize.element(w))) + "\n");
		for (var i = r.nextInt(1, 6); i > 0; i--) {
			if (r.nextBoolean())
				b.add("### " + Util.capitalizeFirstChar(Randomize.phrase(3, 7, () -> Randomize.element(w))) + "\n");
			if (r.nextInt(3) == 2)
				b.add(Stream.iterate("", x -> "- " + Randomize.phrase(5, 11, () -> Randomize.element(w))).skip(1)
						.limit(r.nextInt(2, 6)).collect(Collectors.joining("\n")) + "\n");
			else
				b.add(Stream.iterate("", x -> Randomize.sentence(5, 11, () -> Randomize.element(w))).skip(1)
						.limit(r.nextInt(2, 6)).collect(Collectors.joining(" ")) + "\n");
		}
		return b.build().collect(Collectors.joining("\n"));
	}
}