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

export default class PaginationNav extends FlexibleElement {

	static get observedAttributes() {
		return ["data-pages-count", "data-page-number"];
	}

	static get templateName() {
		return "pagination-nav";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("PaginationNav.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("PaginationNav.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("PaginationNav.handleClick", event);
		event.preventDefault();
		const el = event.target.closest(".page-item");
		if (!el || el.classList.contains("active"))
			return;
		const pn = parseInt(el.textContent.trim());
		this.dispatchEvent(new CustomEvent("select-page", {
			bubbles: true,
			detail: { pageNumber: pn }
		}));
	}

	async updateDisplay() {
		// console.log("PaginationNav.updateDisplay");
		if (!this.isConnected)
			return;
		this.appendChild(this.interpolateDom({
			$template: "",
			items: (() => {
				const pc = this.dataset.pagesCount ? parseInt(this.dataset.pagesCount) : 0;
				const pn = this.dataset.pageNumber ? parseInt(this.dataset.pageNumber) : 1;
				return pc > 1 ? Array.from({ length: pc }, (_, i) => ({
					$template: "item",
					class: `page-item ${i + 1 === pn ? "active" : ""}`,
					number: i + 1
				})) : null;
			})()
		}));
	}
}
