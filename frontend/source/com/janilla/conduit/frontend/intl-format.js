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
import WebComponent from "./web-component.js";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "long",
	year: "numeric",
});

const formatters = {
	date: x => dateFormatter.format(new Date(x))
};

export default class IntlFormat extends WebComponent {

	static get observedAttributes() {
		return ["data-type", "data-value"];
	}

	constructor() {
		super();
	}

	async updateDisplay() {
		if (this.dataset.value) {
			const f = this.dataset.type ? formatters[this.dataset.type] : null;
			this.textContent = f ? f(this.dataset.value) : this.dataset.value;
		} else
			this.textContent = "";
	}
}
