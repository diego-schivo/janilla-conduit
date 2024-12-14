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

function updateElement(element, active, more) {
	if (active) {
		// console.log("PageRouter.updateElement", element);
		element.setAttribute("slot", "content");
	} else
		element.removeAttribute("slot");

	if (more)
		more(element, active);
}

export default class PageRouter extends FlexibleElement {

	static get observedAttributes() {
		return ["data-path"];
	}

	static get templateName() {
		return "page-router";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	async update() {
		// console.log("PageRouter.update");
		await super.update();
		this.interpolate ??= this.createInterpolateDom();
		this.shadowRoot.appendChild(this.interpolate());
		const nn = this.dataset.path.split("/");
		updateElement(this.querySelector("article-page"), nn[1] === "article", (el, a) => {
			if (a)
				el.setAttribute("data-slug", nn[2]);
			else
				el.removeAttribute("data-slug");
		});
		updateElement(this.querySelector("editor-page"), nn[1] === "editor", (el, a) => {
			if (a && nn[2])
				el.setAttribute("data-slug", nn[2]);
			else
				el.removeAttribute("data-slug");
		});
		updateElement(this.querySelector("home-page"), nn[1] === "");
		updateElement(this.querySelector("login-page"), nn[1] === "login");
		updateElement(this.querySelector("profile-page"), nn[1]?.startsWith("@"), (el, a) => {
			if (a)
				el.setAttribute("data-username", decodeURIComponent(nn[1].substring(1)));
			else
				el.removeAttribute("data-username");
		});
		updateElement(this.querySelector("register-page"), nn[1] === "register");
		updateElement(this.querySelector("settings-page"), nn[1] === "settings");
	}
}
