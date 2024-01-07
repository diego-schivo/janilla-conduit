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

import java.util.Properties;
import java.util.stream.Collectors;

import com.janilla.http.HttpRequest;
import com.janilla.http.HttpResponse;
import com.janilla.http.HttpResponse.Status;
import com.janilla.web.Handle;
import com.janilla.web.AnnotationDrivenToInvocation;

public class AccessControl {

	Properties configuration;

	AnnotationDrivenToInvocation toEndpointInvocation;

	public Properties getConfiguration() {
		return configuration;
	}

	public void setConfiguration(Properties configuration) {
		this.configuration = configuration;
	}

	public AnnotationDrivenToInvocation getToEndpointInvocation() {
		return toEndpointInvocation;
	}

	public void setToEndpointInvocation(AnnotationDrivenToInvocation toEndpointInvocation) {
		this.toEndpointInvocation = toEndpointInvocation;
	}

	@Handle(method = "OPTIONS", uri = "/api/(.*)")
	public void allow(HttpRequest request, HttpResponse response) {
		var o = configuration.getProperty("conduit.backend.cors.origin");
		var s = toEndpointInvocation.getValueAndGroupsStream(request).flatMap(w -> w.value().methods().stream())
				.map(m -> m.getAnnotation(Handle.class).method()).collect(Collectors.toSet());
		var m = s.contains(null) ? "*" : s.stream().collect(Collectors.joining(", "));
		var h = configuration.getProperty("conduit.backend.cors.headers");

		response.setStatus(new Status(204, "No Content"));
		response.getHeaders().set("Access-Control-Allow-Origin", o);
		response.getHeaders().set("Access-Control-Allow-Methods", m);
		response.getHeaders().set("Access-Control-Allow-Headers", h);
	}
}
