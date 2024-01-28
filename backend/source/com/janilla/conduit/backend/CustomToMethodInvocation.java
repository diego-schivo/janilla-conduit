///*
// * MIT License
// *
// * Copyright (c) 2024 Diego Schivo
// *
// * Permission is hereby granted, free of charge, to any person obtaining a copy
// * of this software and associated documentation files (the "Software"), to deal
// * in the Software without restriction, including without limitation the rights
// * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// * copies of the Software, and to permit persons to whom the Software is
// * furnished to do so, subject to the following conditions:
// *
// * The above copyright notice and this permission notice shall be included in all
// * copies or substantial portions of the Software.
// *
// * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// * SOFTWARE.
// */
//package com.janilla.conduit.backend;
//
//import java.util.Map;
//import java.util.Objects;
//import java.util.function.Supplier;
//import java.util.stream.Collectors;
//
//import com.janilla.reflect.Reflection;
//import com.janilla.util.Lazy;
//import com.janilla.web.AnnotationDrivenToMethodInvocation;
//
//class CustomToMethodInvocation extends AnnotationDrivenToMethodInvocation {
//
//	ConduitBackend backend;
//
//	Map<Class<?>, Supplier<Object>> properties = Reflection.properties(ConduitBackend.class)
//			.map(n -> Reflection.getter(ConduitBackend.class, n)).filter(Objects::nonNull)
//			.collect(Collectors.toMap(g -> g.getReturnType(), g -> Lazy.of(() -> {
//				try {
//					return g.invoke(backend);
//				} catch (ReflectiveOperationException e) {
//					throw new RuntimeException(e);
//				}
//			})));
//
//	@Override
//	protected Object getInstance(Class<?> c) {
//		var i = super.getInstance(c);
//		for (var j = Reflection.properties(c).map(n -> Reflection.setter(c, n)).filter(Objects::nonNull).iterator(); j
//				.hasNext();) {
//			var s = j.next();
//			var t = s.getParameterTypes()[0];
//			var v = properties.get(t);
//			if (v != null)
//				try {
//					s.invoke(i, v.get());
//				} catch (ReflectiveOperationException e) {
//					throw new RuntimeException(e);
//				}
//		}
//		return i;
//	}
//}
