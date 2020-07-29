# Keep track of today's date and yesterday for comparing files.
today=$(date +%Y-%m-%d)
yesterday=$(date -v -1d +%Y-%m-%d)

# Navigate to folder containing the local versions of the data.
pushd ${HOME}/git/OH-COVID

# Get COVIDSummaryData from Ohio website.
curl https://coronavirus.ohio.gov/static/COVIDSummaryData.csv -o data/$today.csv

# If it's the same file as yesterday, delete it.
if [ -f "data/$yesterday.csv" ]; then
if [[ $(diff data/$today.csv data/$yesterday.csv) ]]; then
    echo "Got new data."
    branch=$(git branch --show-current)
    git checkout master
    git add data/*
    git commit -m "Data through $today"
    git push origin master
    git checkout $branch
else
    echo "No new data. Deleting file for $today."
    rm data/$today.csv
fi
else
    echo "Got new data."
    branch=$(git branch --show-current)
    git checkout master
    git add data/*
    git commit -m "Data through $today"
    git push origin master
    git checkout $branch
fi

popd
