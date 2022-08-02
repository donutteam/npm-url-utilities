//
// Exports
//

/**
 * This is a list of domains where HEAD requests are known to be problematic and should NEVER be used.
 *
 * This exists because some tiny, independent, obscure web services (such as Mega) are unacceptable bullshit and do not respond to HEAD requests.
 *
 * @type {Set<String>}
 */
export const noHeadRequestDomains = new Set(
	[
		"mega.io",
		"mega.nz",
		"mega.co.nz",
	]);

/**
 * Fetches the requested URL and returns its Location header, if it has one.
 *
 * @param {URL} url A URL object.
 * @returns {String} The Location header returned by the above URL OR undefined if it didn't have one.
 * @author Loren Goodwin
 */
export async function getLocationHeader(url)
{
	const tryHeadRequest = !noHeadRequestDomains.has(url.hostname);

	let response;

	if (tryHeadRequest)
	{
		const controller = new AbortController();

		try
		{
			setTimeout(() =>
			{
				controller.abort();
			}, 3000);

			response = await fetch(url,
				{
					method: "HEAD",
					redirect: "manual",
					signal: controller.signal,
				});
		}
		catch (error)
		{
			console.error(`[URLUtil] A request on the domain ${ url.hostname } failed to respond to a HEAD request.`);
		}
	}

	if (response == undefined)
	{
		response = await fetch(url,
			{
				method: "GET",
				redirect: "manual",
			});
	}

	const locationHeader = response.headers.get("Location");

	return locationHeader;
}

/**
 * Gets the chain of URLs that a given URL redirects through.
 *
 * @param {URL} url A URL object.
 * @param {Number} [maxChainLength] The maximum length of the redirect chain. Defaults to 20 to match browsers.
 * @returns {Array<URL>|null} An array of URLs in the chain. This will be null if something went wrong getting the chain.
 * @author Loren Goodwin
 */
export async function getRedirectChain(url, maxChainLength = 20)
{
	const chain = [];

	while (chain.length < maxChainLength)
	{
		chain.push(url);

		try
		{
			const locationHeader = await getLocationHeader(url);

			if (locationHeader != undefined)
			{
				if (locationHeader.startsWith("/"))
				{
					// NOTE: Some websites crap all over the original intentions of the Location header by using relative paths
					//	(such as the legacy Donut Team Site lol)
					//
					// This block is to accomodate that nonsense
					url = new URL(locationHeader, url);
				}
				else
				{
					url = new URL(locationHeader);
				}

				continue;
			}
		}
		catch (error)
		{
			console.error(`[URL] An error occured requesting ${ url } as part of a redirect chain: `, error);

			return null;
		}

		break;
	}

	return chain;
}

/**
 * Checks if the given string is a valid URL.
 *
 * @param {String} url A string.
 * @returns {Boolean} Whether or not the string was a valid URL.
 * @author Loren Goodwin
 */
export function isValidURL(url)
{
	try
	{
		// If this succeeds, then the string is a valid URL
		new URL(url);

		return true;
	}
	catch (error)
	{
		return false;
	}
}