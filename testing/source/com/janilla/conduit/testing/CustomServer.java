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
package com.janilla.conduit.testing;

import java.net.URI;

import com.janilla.http.HttpExchange;
import com.janilla.http.HttpRequest;
import com.janilla.http.HttpResponse;
import com.janilla.http.HttpServer;

public class CustomServer extends HttpServer {

	@Override
	protected HttpExchange buildExchange(HttpRequest request, HttpResponse response) {
		URI u;
		try {
			u = request.getURI();
		} catch (NullPointerException e) {
			u = null;
		}
		if (Test.fullstack != null && u != null && u.getPath().startsWith("/api/")) {
			var e = Test.fullstack.getBackend().getFactory().create(HttpExchange.class);
			e.setRequest(request);
			e.setResponse(response);
			return e;
		}
		return super.buildExchange(request, response);
	}
}
