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

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class Validation {

	public Properties configuration;

	Map<String, Collection<String>> errors = new LinkedHashMap<>();

	boolean hasNotBeenTaken(String name, Object value) {
		if (value == null)
			return true;
		errors.computeIfAbsent(name, _ -> new LinkedHashSet<>()).add("has already been taken");
		return false;
	}

	boolean isNotBlank(String name, String value) {
		if (value != null && !value.isBlank())
			return true;
		errors.computeIfAbsent(name, _ -> new LinkedHashSet<>()).add("can't be blank");
		return false;
	}

	boolean isNotTooLong(String name, String value, int maxLength) {
		if ((value != null ? value.length() : 0) <= maxLength)
			return true;
		errors.computeIfAbsent(name, _ -> new LinkedHashSet<>()).add("can't exceed " + maxLength + " characters");
		return false;
	}

	static Pattern nonWord = Pattern.compile("[^\\p{L}]+", Pattern.UNICODE_CHARACTER_CLASS);

	static Set<String> safeWords = nonWord.splitAsStream(
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
					+ " Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
					+ " Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
					+ " Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.")
			.map(String::toLowerCase).sorted().collect(Collectors.toCollection(LinkedHashSet::new));

	boolean isSafe(String name, String value) {
		if (!Boolean.parseBoolean(configuration.getProperty("conduit.live-demo")))
			return true;
		if (value == null || value.isEmpty()
				|| nonWord.splitAsStream(value).allMatch(w -> w.isEmpty() || safeWords.contains(w.toLowerCase())))
			return true;
		errors.computeIfAbsent(name, _ -> new LinkedHashSet<>())
				.add("can only contain \"Lorem ipsum\" words: " + safeWords);
		return false;
	}

	boolean isUnique(String name, Object value) {
		if (value == null)
			return true;
		errors.computeIfAbsent(name, _ -> new LinkedHashSet<>()).add("must be unique");
		return false;
	}

	boolean isValid(String name, boolean value) {
		if (value)
			return true;
		errors.computeIfAbsent(name, _ -> new LinkedHashSet<>()).add("is invalid");
		return false;
	}

	boolean orThrow() {
		if (errors.isEmpty())
			return true;
//		System.out.println("errors=" + errors);
		throw new ValidationException(errors);
	}

	static String emojiPrefix = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><text x='2' y='12.5' font-size='12'>";

	static String emojiSuffix = "</text></svg>";

	static Pattern otherSymbol = Pattern.compile("\\p{So}", Pattern.UNICODE_CHARACTER_CLASS);

	boolean isEmoji(String name, String value) {
		if (!Boolean.parseBoolean(configuration.getProperty("conduit.live-demo")))
			return true;
		if (value == null || value.isEmpty()
				|| (value.startsWith(emojiPrefix) && value.endsWith(emojiSuffix)
						&& otherSymbol
								.matcher(value.substring(emojiPrefix.length(), value.length() - emojiSuffix.length()))
								.matches()))
			return true;
		errors.computeIfAbsent(name, _ -> new LinkedHashSet<>())
				.add("must be an emoji: " + emojiPrefix + new String(Character.toChars(0x1F600)) + emojiSuffix);
		return false;
	}
}
