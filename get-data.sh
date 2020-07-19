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
else
    echo "No new data. Deleting file for $today."
    rm data/$today.csv
fi
else
    echo "Got new data."
fi

popd
