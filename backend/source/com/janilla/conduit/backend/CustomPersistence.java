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

import com.janilla.database.Index;
import com.janilla.io.ElementHelper;
import com.janilla.io.ElementHelper.SortOrder;
import com.janilla.io.ElementHelper.TypeAndOrder;
import com.janilla.persistence.Crud;
import com.janilla.persistence.Persistence;

class CustomPersistence extends Persistence {

	@Override
	public <K, V> boolean initializeIndex(String name, Index<K, V> index) {
		if (super.initializeIndex(name, index))
			return true;
		return switch (name) {
		case "Article.favoriteList", "User.followList" -> {
			@SuppressWarnings("unchecked")
			var i = (Index<Long, Long>) index;
			i.setKeyHelper(ElementHelper.LONG);
			i.setValueHelper(ElementHelper.LONG);
			yield true;
		}
		case "Tag.count" -> {
			@SuppressWarnings("unchecked")
			var i = (Index<Object[], String>) index;
			i.setKeyHelper(ElementHelper.of(new TypeAndOrder(Long.class, SortOrder.DESCENDING)));
			i.setValueHelper(ElementHelper.STRING);
			yield true;
		}
		case "User.favoriteList" -> {
			@SuppressWarnings("unchecked")
			var i = (Index<Long, Object[]>) index;
			i.setKeyHelper(ElementHelper.LONG);
			i.setValueHelper(ElementHelper.of(Article.class, "-createdAt", "id"));
			yield true;
		}
		default -> false;
		};
	}

	@Override
	protected void createStoresAndIndexes() throws IOException {
		super.createStoresAndIndexes();
		for (var n : new String[] { "Article.favoriteList", "Tag.count", "User.favoriteList", "User.followList" })
			database.performTransaction(() -> database.createIndex(n));
	}

	@Override
	protected <E> Crud<E> newCrud(Class<E> type) {
		if (type == Article.class) {
			@SuppressWarnings("unchecked")
			var c = (Crud<E>) new ArticleCrud();
			return c;
		}

		return super.newCrud(type);
	}
}
