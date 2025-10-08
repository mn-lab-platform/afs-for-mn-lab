import re
from django_hosts import patterns, host

host_patterns = patterns(
    "",
    host(re.sub(r"_", r"-", r"afs_plocal"), "afs_plocal.urls", name="afs_plocal"),
)
