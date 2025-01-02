/*
 * MIT License
 *
 * Copyright (c) 2024-2025 Diego Schivo
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

import com.janilla.database.Index;
import com.janilla.io.ElementHelper;
import com.janilla.persistence.Crud;
import com.janilla.persistence.Persistence;

public class CustomPersistence extends Persistence {

	@Override
	public <K, V> boolean initializeIndex(String name, Index<K, V> index) {
		if (super.initializeIndex(name, index))
			return true;
		return switch (name) {
		case "User.favoriteList", "User.followList" -> {
			@SuppressWarnings("unchecked")
			var i = (Index<Long, Long>) index;
			i.setKeyHelper(ElementHelper.LONG);
			i.setValueHelper(ElementHelper.LONG);
			yield true;
		}
		case "Tag.count" -> {
			@SuppressWarnings("unchecked")
			var i = (Index<Object[], String>) index;
			i.setKeyHelper(ElementHelper.of(new ElementHelper.TypeAndOrder(Long.class, ElementHelper.SortOrder.DESCENDING)));
			i.setValueHelper(ElementHelper.STRING);
			yield true;
		}
		case "Article.favoriteList" -> {
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
	protected void createStoresAndIndexes() {
		super.createStoresAndIndexes();
		for (var n : new String[] { "Article.favoriteList", "Tag.count", "User.favoriteList", "User.followList" })
			database.perform((_, ii) -> {
				ii.create(n);
				return null;
			}, true);
	}

	@Override
	protected <E> Crud<E> createCrud(Class<E> type) {
		if (type == Article.class) {
			@SuppressWarnings("unchecked")
			var c = (Crud<E>) new ArticleCrud();
			return c;
		}
		if (type == User.class) {
			@SuppressWarnings("unchecked")
			var c = (Crud<E>) new UserCrud();
			return c;
		}
		return super.createCrud(type);
	}
}
