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
class Actions {

	document;

	addArticleTag = async x => {
		const e = (await this.select('input[placeholder="Enter tags"]'));
		e.value = x;
		e.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
	}

	createArticle = async () => {
		(await this.select('//a[contains(normalize-space(),"New Article")]')).click();
		(await this.select('input[placeholder="Article Title"]')).value = 'foo';
		(await this.select('input[placeholder="What\'s this article about?"]')).value = 'foo bar';
		(await this.select('textarea[placeholder^="Write your article"]')).value = 'foo bar baz';
		for (const x of ['foo', 'bar'])
			await this.addArticleTag(x);
		(await this.select('//button[normalize-space()="Publish Article"]')).click();
	}

	deleteArticle = async () => {
		(await this.select('//button[normalize-space()="Delete Article"]')).click();
	}
	
	filterArticlesByTag = async () => {
		(await this.select('//p[normalize-space()="Popular Tags"]/following-sibling::*/a')).click();
	}

	logoutUser = async () => {
		(await this.select('//a[normalize-space()="foo bar"]')).click();
		(await this.select('//a[normalize-space()="Edit Profile Settings"]')).click();
		(await this.select('//button[normalize-space()="Or click here to logout."]')).click();
	}

	registerUser = async () => {
		(await this.select('//a[normalize-space()="Sign up"]')).click();
		(await this.select('input[placeholder="Username"]')).value = 'foo bar';
		(await this.select('input[placeholder="Email"]')).value = 'foo@bar';
		(await this.select('input[placeholder="Password"]')).value = 'foo';
		(await this.select('//button[normalize-space()="Sign up"]')).click();
	}

	removeArticleTag = async x => {
		const e = (await this.select(`//input[@placeholder="Enter tags"]/following-sibling::*/span[normalize-space()="${x}"]`));
		e.firstElementChild.click();
	}

	updateArticle = async () => {
		(await this.select('//a[normalize-space()="Edit Article"]')).click();
		(await this.select('input[placeholder="What\'s this article about?"]')).value = 'foo qux';
		await this.removeArticleTag('bar');
		await this.addArticleTag('qux');
		(await this.select('//button[normalize-space()="Publish Article"]')).click();
	}

	select = query => {
		const q = resolve => {
			const e = query.startsWith('//')
				? this.document.evaluate(query, this.document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
				: this.document.querySelector(query);
			if (e)
				setTimeout(() => resolve(e), 100);
			return e;
		};
		return new Promise(resolve => {
			if (!q(resolve))
				new MutationObserver((m, o) => {
					if (q(resolve))
						o.disconnect();
				}).observe(this.document.body, { childList: true, subtree: true });
		});
	};
}

export default Actions;
