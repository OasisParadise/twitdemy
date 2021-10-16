const SUPABASE_URL='https://wtccvsqohflpzaqdjzdn.supabase.co'
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNjU4MDEzMCwiZXhwIjoxOTQyMTU2MTMwfQ.OxOnUt1sZHJw4Ee6iys_m1DJwpDRilJ4KjWaYrTYnrc'

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const courseContainerElement = document.getElementById("couseContainer");
const searchKeywordForm = document.getElementById("searchKeywordForm");


let isFetching = false;
let hasMore = true;
let courseItems = [];
let searchKeywordParams = null;

searchKeywordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    //Clear all courseItems and start from scratch
    courseItems = [];
    courseContainerElement.innerHTML = "";
    let searchInput = document.getElementById("keywords");

    let baseUrl = location.protocol + '//' + location.host + location.pathname;
    let newUrl = `${baseUrl}?keywords=${searchInput.value}`;
    history.pushState(null, null, newUrl);

    await fetchDataByKeywords(searchInput.value);
})


window.addEventListener('load', async() => {
    //Check for possible query string
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    searchKeywordParams = urlParams.get("keywords");

    if (searchKeywordParams == null)
    {
        await fetchData();
    }
    else
    {
        await fetchDataByKeywords(searchKeywordParams);
    }

});


courseContainerElement.addEventListener('scroll', async (e) => {
    if (hasMore) {
        //Ensure that no multiple duplicated counts
        if (isFetching) return;

        if ((courseContainerElement.scrollTop + courseContainerElement.clientHeight) >= (courseContainerElement.scrollHeight - 5)){
            if (searchKeywordParams != null)
            {
                await fetchDataByKeywords(searchKeywordParams);
            }
            else
            {
                await fetchData();
            }
        }
    }
});

async function fetchData(){
    isFetching = true;

    //Only fetch 20 at a time
    const {data, error} = await supabaseClient.from("Udemy").select().gt("expirationTime", new Date().toISOString()).range(courseItems.length, courseItems.length+19);
    if (error)
    {
        console.log(error.message);
    }

    //Since data.length returns a length of 0
    if (courseItems.length == (courseItems.length + data.length))
    {
        hasMore = false;
        console.log("There is no more data to be fetch");
        return;
    }
    //Append element into courseContainer
    data.forEach(element => {
        courseContainerElement.innerHTML += CreateCardElement(element.title, element.udemyUrl, element.imageHeader, element.expirationTime);
    });
    //Shallow copy cannot directly modify objects
    courseItems = [...courseItems, ...data];
    isFetching = false;
}

async function fetchDataByKeywords(keyword)
{
    let filterKeyword = keyword.split(' ').join('&');
    isFetching = true;
    const {data, error} = await supabaseClient.from("Udemy")
                            .select()
                            .textSearch("title", filterKeyword)
                            .gt("expirationTime", new Date().toISOString())
                            .range(courseItems.length, courseItems.length+19);

    if (error)
    {
        console.log("Expected error " + error.message);
        return;
    }
    if (courseItems.length == (courseItems.length + data.length))
    {
        hasMore = false;
        console.log("There is no more data to be fetch");
        return;
    }
    
    data.forEach(element => {
        courseContainerElement.innerHTML += CreateCardElement(element.title, element.udemyUrl, element.imageHeader, element.expirationTime);
    });
    //Shallow copy cannot directly modify objects
    courseItems = [...courseItems, ...data];
    isFetching = false;
}


function CreateCardElement(title, udemyUrl, udemyImage, expiryTimestamp)
{
    return (
        `<div class="border border-gray-200 rounded-lg bg-opacity-30 backdrop-filter backdrop-blur-lg bg-black">
            <a href="${udemyUrl}">
                <img src="${udemyImage}" alt="Course Images" class="rounded-t-lg" loading="lazy"/>
                <div class="px-3 py-2">
                    <h2 class="font-bold text-md text-white">${title}</h2>
                    <span class="text-sm text-gray-400 font-light pt-2">${ConvertTimestampToReadableString(expiryTimestamp)}</span>
                </div>
            </a>
        </div>`
    );
}

function ConvertTimestampToReadableString(isoString)
{
    let currentDateTime = new Date();
    let expirationDateTime = new Date(isoString);
    let differenceTime = expirationDateTime -currentDateTime;
    let diffDays = Math.floor(differenceTime / 86400000);
    var diffHrs = Math.floor((differenceTime % 86400000) / 3600000); // hours
    var diffMins = Math.round(((differenceTime % 86400000) % 3600000) / 60000); // minutes
    let concatenateExpirationString = `Expires in ${diffDays} days, ${diffHrs} hours, ${diffMins} minutes`;

    return concatenateExpirationString;
}