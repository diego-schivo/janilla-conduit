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

import java.util.Iterator;

import com.janilla.http.HttpExchange;
import com.janilla.ioc.DependencyInjector;
import com.janilla.java.Java;
import com.janilla.json.JsonToken;
import com.janilla.json.ReflectionJsonIterator;
import com.janilla.web.JsonHandlerFactory;

public class CustomJsonHandlerFactory extends JsonHandlerFactory {

//	public Properties configuration;
//
//	public Persistence persistence;

	protected final DependencyInjector injector;

	public CustomJsonHandlerFactory(DependencyInjector injector) {
		this.injector = injector;
	}

//	@Override
//	protected void render(Object object, HttpExchange exchange) {
//		super.render(object, exchange);
//	}

	@Override
	protected Iterator<JsonToken<?>> buildJsonIterator(Object object, HttpExchange exchange) {
//		return new CustomReflectionJsonIterator(object, false, () -> ((CustomHttpExchange) exchange).getUser());
		return injector.create(ReflectionJsonIterator.class, Java.hashMap("object", object, "includeType", false));
	}
}
