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
import { FlexibleElement } from "./flexible-element.js";

export default class ErrorList extends FlexibleElement {

	static get observedAttributes() {
		return ["data-messages"];
	}

	static get templateName() {
		return "error-list";
	}

	constructor() {
		super();
	}

	get messages() {
		return this.dataset.messages ? this.dataset.messages.split(",") : [];
	}

	set messages(x) {
		this.dataset.messages = x.join();
	}

	async updateDisplay() {
		// console.log("ErrorList.updateDisplay");
		await super.updateDisplay();
		this.interpolate ??= this.createInterpolateDom();
		const mm = this.messages;
		if (this.items?.length !== mm.length)
			this.items = mm.map(_ => this.createInterpolateDom(1));
		this.appendChild(this.interpolate({
			items: this.items.map((x, i) => x(mm[i]))
		}));
	}
}
