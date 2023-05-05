//
// Exports
//

/**
 * This is a list of domains where HEAD requests are known to be problematic and should NEVER be used.
 *
 * This exists because some tiny, independent, obscure web services (such as Mega) are unacceptable bullshit and do not respond to HEAD requests.
 */
export const noHeadRequestDomains : Set<string> = new Set(
	[
		"mega.co.nz",
		"mega.io",
		"mega.nz",
	]);

/**
 * Fetches the requested URL and returns its Location header, if it has one.
 *
 * @param url A URL object.
 * @returns The Location header returned by the above URL OR null if it didn't have one.
 * @author Loren Goodwin
 */
export async function getLocationHeader(url : URL) : Promise<string>
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
			// If the request was aborted, then we'll try again with a GET request
		}
	}

	if (response == undefined)
	{
		try
		{
			response = await fetch(url,
				{
					method: "GET",
					redirect: "manual",
				});
		}
		catch (error)
		{
			return null;
		}
	}

	if (!response.ok)
	{
		return null;
	}

	const locationHeader = response.headers.get("Location");

	return locationHeader;
}

/**
 * Gets the chain of URLs that a given URL redirects through.
 *
 * @param url A URL object.
 * @param maxChainLength The maximum length of the redirect chain. Defaults to 20 to match browsers.
 * @returns An array of URLs in the chain. This will be null if something went wrong getting the chain.
 * @author Loren Goodwin
 */
export async function getRedirectChain(url : URL, maxChainLength = 20) : Promise<Array<URL>|null>
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
			return null;
		}

		break;
	}

	return chain;
}

/**
 * Checks if the given string is a valid URL.
 *
 * @param url A string.
 * @returns Whether or not the string was a valid URL.
 * @author Loren Goodwin
 */
export function isValidURL(url : string) : boolean
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