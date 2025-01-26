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
import { UpdatableHTMLElement } from "./updatable-html-element.js";

export default class PageDisplay extends UpdatableHTMLElement {

	static get observedAttributes() {
		return ["data-path"];
	}

	static get templateName() {
		return "page-display";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	async updateDisplay() {
		// console.log("PageDisplay.updateDisplay");
		this.shadowRoot.appendChild(this.interpolateDom({ $template: "shadow" }));
		const nn = this.dataset.path.split("/");
		const hs = history.state ?? {};
		const pp = {
			articlePage: (() => {
				const a = nn[1] === "article";
				const a2 = hs["article-page"]?.article;
				return {
					$template: "article-page",
					slot: a ? (a2 && a2.slug == nn[2] ? "content" : "content2") : null,
					slug: a ? nn[2] : null
				};
			})(),
			editorPage: (() => {
				const a = nn[1] === "editor";
				const a2 = hs["editor-page"]?.article;
				return {
					$template: "editor-page",
					slot: a ? (a2 && a2.slug == nn[2] ? "content" : "content2") : null,
					slug: a ? nn[2] : null
				};
			})(),
			homePage: {
				$template: "home-page",
				slot: nn[1] === "" ? "content" : null
			},
			loginPage: {
				$template: "login-page",
				slot: nn[1] === "login" ? "content" : null
			},
			profilePage: (() => {
				const a = nn[1]?.startsWith("@");
				const u = a ? decodeURIComponent(nn[1].substring(1)) : null;
				const s = a ? hs["profile-page"] : null;
				return {
					$template: "profile-page",
					slot: a ? (s?.profile && s.profile.username == u ? "content" : "content2") : null,
					username: u
				};
			})(),
			registerPage: {
				$template: "register-page",
				slot: nn[1] === "register" ? "content" : null
			},
			settingsPage: {
				$template: "settings-page",
				slot: nn[1] === "settings" ? "content" : null
			}
		};
		if (Object.values(pp).every(x => x.slot !== "content")) {
			const t = Array.prototype.find.call(this.children, x => x.slot === "content")?.tagName?.toLowerCase();
			if (t)
				Array.prototype.find.call(Object.values(pp), x => x.$template === t).slot = "content";
		}
		this.appendChild(this.interpolateDom({
			$template: "",
			...Object.fromEntries(Object.entries(pp).filter(([_, v]) => v.slot))
		}));
	}
}
