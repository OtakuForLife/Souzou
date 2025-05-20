from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class IPRequestRateHighThrottle(AnonRateThrottle):
    scope = 'ip-high-rate'

class IPRequestRateLowThrottle(AnonRateThrottle):
    scope = 'ip-low-rate'

class UserRequestRateThrottle(UserRateThrottle):
    scope = 'user-high-rate'

class UserRequestRateLowThrottle(UserRateThrottle):
    scope = 'user-low-rate'
