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
const select = (document, expression) => {
	const q = resolve => {
		const e = document.evaluate(expression, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
		// console.log(expression, e);
		if (e)
			resolve(e);
		return e;
	};
	let o, t;
	const r = resolve => {
		return element => {
			if (o) {
				clearTimeout(t);
				o.disconnect();
				o = null;
			}
			setTimeout(() => resolve(element), 200);
		};
	};
	return new Promise((resolve, reject) => {
		if (!q(r(resolve))) {
			o = new MutationObserver(() => q(r(resolve)));
			o.observe(document.body, { childList: true, subtree: true });
			t = setTimeout(() => {
				if (o) {
					o.disconnect();
					o = null;
				}
				reject(`Timeout (expression=${expression})`);
			}, 2000);
		}
	});
};

class Actions {

	document;

	addTag = async tag => {
		const e = await select(this.document, `//input[contains(@placeholder,"tags")]`);
		e.value = tag;
		e.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
	}

	enter = async (placeholder, text) => {
		(await select(this.document, `//*[contains(@placeholder,"${placeholder}")]`)).value = text;
	}

	filterByFeed = async title => {
		(await select(this.document, `//*[contains(@class,"feed-toggle")]//a[contains(normalize-space(),"${title}")]`)).click();
		await select(this.document, `//*[contains(@class,"feed-toggle")]//a[contains(@class,"active") and contains(normalize-space(),"${title}")]`);
	}

	filterByPage = async page => {
		(await select(this.document, `//*[contains(@class,"pagination")]//a[contains(normalize-space(),"${page}")]`)).click();
		await select(this.document, `//*[@class="pagination"]//*[contains(@class,"active")]/a[contains(normalize-space(),"${page}")]`);
	}

	filterByTag = async tag => {
		(await select(this.document, `//*[contains(@class,"sidebar")]//a[contains(normalize-space(),"${tag}")]`)).click();
		await select(this.document, `//*[contains(@class,"feed-toggle")]//a[contains(@class,"active") and contains(normalize-space(),"${tag}")]`);
	}

	login = async (email, password) => {
		await this.openLogin();
		await this.enter('Email', email);
		await this.enter('Password', password);
		await this.submit('Sign in');
	}

	openArticle = async title => {
		(await select(this.document, `//*[contains(@class,"article-preview")]//h1[contains(normalize-space(),"${title}")]`)).click();
		await select(this.document, `//*[contains(@class,"article-page")]`);
	}

	openEditor = async () => {
		(await select(this.document, `//nav//a[contains(normalize-space(),"New Article")]`)).click();
		await select(this.document, `//*[contains(@class,"editor-page")]`);
	}

	openLogin = async () => {
		(await select(this.document, `//nav//a[contains(normalize-space(),"Sign in")]`)).click();
		await select(this.document, `//*[contains(@class,"auth-page")]`);
	}

	openProfile = async username => {
		(await select(this.document, `//*[contains(@class,"article-meta")]//a[contains(normalize-space(),"${username}")]`)).click();
		await select(this.document, `//*[contains(@class,"profile-page")]`);
	}

	openRegister = async () => {
		(await select(this.document, `//nav//a[contains(normalize-space(),"Sign up")]`)).click();
		await select(this.document, `//*[contains(@class,"auth-page")]`);
	}

	openSettings = async () => {
		(await select(this.document, `//nav//a[contains(normalize-space(),"Settings")]`)).click();
		await select(this.document, `//h1[contains(normalize-space(),"Your Settings")]`);
	}

	submit = async text => {
		(await select(this.document, `//button[contains(normalize-space(),"${text}")]`)).click();
	}
}

export default Actions;
