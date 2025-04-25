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
import { WebComponent } from "./web-component.js";

export default class PopularTags extends WebComponent {

	static get templateName() {
		return "popular-tags";
	}

	constructor() {
		super();
		this.attachShadow({ mode: "open" });
	}

	get historyState() {
		const s = this.state;
		return {
			...history.state,
			"popular-tags": Object.fromEntries(["tags"].map(x => [x, s[x]]))
		};
	}

	connectedCallback() {
		// console.log("PopularTags.connectedCallback");
		super.connectedCallback();
		const s = history.state?.["popular-tags"];
		if (s)
			Object.assign(this.state, s);
		this.addEventListener("click", this.handleClick);
	}

	disconnectedCallback() {
		// console.log("PopularTags.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("click", this.handleClick);
	}

	handleClick = event => {
		// console.log("PopularTags.handleClick", event);
		const el = event.target.closest(".tag-default");
		if (!el)
			return;
		event.preventDefault();
		event.stopPropagation();
		this.dispatchEvent(new CustomEvent("select-tag", {
			bubbles: true,
			detail: { tag: el.textContent.trim() }
		}));
	}

	async updateDisplay() {
		// console.log("PopularTags.updateDisplay");
		const s = this.state;
		const df = this.interpolateDom(!s.tags ? {
			$template: "",
			loadingSlot: "content"
		} : {
			$template: "",
			emptySlot: s.tags.length ? null : "content",
			slot: s.tags.length ? "content" : null,
			tags: s.tags.map(x => ({
				$template: "tag",
				text: x
			}))
		});
		this.shadowRoot.append(...df.querySelectorAll("div:has(slot)"));
		this.appendChild(df);
		if (!s.tags) {
			const rl = this.closest("root-layout");
			const u = new URL(rl.dataset.apiUrl);
			u.pathname += "/tags";
			const j = await (await fetch(u, { headers: rl.state.apiHeaders })).json();
			s.tags = j.tags;
			history.replaceState(this.historyState, "");
			this.requestDisplay(0);
		}
	}
}
