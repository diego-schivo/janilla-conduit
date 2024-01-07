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
import java.util.stream.Stream;

import com.janilla.database.Index;
import com.janilla.persistence.Persistence;
import com.janilla.web.Handle;

public class TagApi {

	Persistence persistence;

	public Persistence getPersistence() {
		return persistence;
	}

	public void setPersistence(Persistence persistence) {
		this.persistence = persistence;
	}

	@Handle(method = "GET", uri = "/api/tags")
	public Tags tags() throws IOException {
//		var c = persistence.getCrud(Article.class);
//		return new Tags(c.<String>getIndexValues("tag").limit(10));
//		return new Tags(persistence.getDatabase().indexApply("Tag.count", i -> {
//			@SuppressWarnings("unchecked")
//			var j = (Index<Object[], String>) i;
//			return j.values();
//		}));
		var t = persistence.getDatabase().<Object[], String, Stream<String>>indexApply("Tag.count", Index::values)
				.limit(10);
		return new Tags(t);
	}

	public record Tags(Stream<String> tags) {
	}
}
