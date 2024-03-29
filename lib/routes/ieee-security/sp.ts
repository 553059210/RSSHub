import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
const url = 'https://www.ieee-security.org/';
// https://www.ieee-security.org/TC/SP2023/program-papers.html

export const route: Route = {
    path: '/security-privacy',
    categories: ['journal'],
    example: '/ieee-security/security-privacy',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['ieee-security.org/TC/SP-Index.html', 'ieee-security.org/'],
        },
    ],
    name: 'IEEE Symposium on Security and Privacy',
    maintainers: ['ZeddYu'],
    handler,
    url: 'ieee-security.org/TC/SP-Index.html',
    description: `Return results from 2020`,
};

async function handler() {
    const last = new Date().getFullYear() + 1;
    const urlList = Array.from({ length: last - 2020 }, (_, v) => `${url}TC/SP${v + 2020}/program-papers.html`);
    const responses = await got.all(urlList.map((url) => got(url)));

    const items = responses.map((response) => {
        const $ = load(response.data);
        return $('div.panel-body > div.list-group-item')
            .toArray()
            .map((item) => {
                item = $(item);
                const title = item.find('b').text().trim();
                const link = response.url;
                return {
                    title,
                    author: item.html().trim().split('<br>')[1].trim(),
                    link: `${link}#${title}`,
                    pubDate: parseDate(link.match(/SP(\d{4})/)[1], 'YYYY'),
                };
            });
    });

    return {
        title: 'S&P',
        link: `${url}TC/SP-Index.html`,
        description: 'IEEE Symposium on Security and Privacy Accepted Papers',
        allowEmpty: true,
        item: items.flat(),
    };
}
